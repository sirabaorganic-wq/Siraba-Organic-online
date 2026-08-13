const Vendor = require("../models/Vendor");
const VendorOrder = require("../models/VendorOrder");
const EnterpriseSettlement = require("../models/EnterpriseSettlement");
const { getMinimumMonthlyCommitment } = require("../config/vendorPlans");

/**
 * Calculate Commissionable GMV for a vendor during a specific billing window.
 * Formula: Sum of subtotal for non-cancelled VendorOrders, adjusted for refunds/returns.
 */
const calculateMonthlyGMV = async (vendorId, startDate, endDate) => {
  const vendorOrders = await VendorOrder.find({
    vendor: vendorId,
    createdAt: { $gte: startDate, $lte: endDate },
    status: { $ne: "cancelled" }, // Exclude cancelled orders
  });

  let eligibleGMV = 0;
  let baseCommissionGenerated = 0;
  let eligibleOrderCount = 0;

  for (const vo of vendorOrders) {
    // Exclude full RTO / return if marked completely refunded
    if (vo.payoutStatus === "refunded" && vo.returnStatus === "Refunded" && vo.subtotal <= 0) {
      continue;
    }

    const orderSubtotal = Math.max(0, vo.subtotal || 0);
    const orderCommission = Math.max(0, vo.commission || 0);

    eligibleGMV += orderSubtotal;
    baseCommissionGenerated += orderCommission;
    eligibleOrderCount++;
  }

  // Ensure deterministic 2-decimal money rounding
  eligibleGMV = Math.round(eligibleGMV * 100) / 100;
  baseCommissionGenerated = Math.round(baseCommissionGenerated * 100) / 100;

  return {
    eligibleGMV,
    baseCommissionGenerated,
    eligibleOrderCount,
  };
};

/**
 * Enterprise Commitment Mathematics Engine
 * Enforces:
 * - 6% Calculated Platform Commission
 * - Minimum Commitment: MAX(6% GMV, ₹20,000)
 * - Commitment Adjustment: MAX(₹20,000 - 6% GMV, 0)
 * - Subscription Fee: ₹14,999/month
 * - Minimum Recurring Platform Revenue: ₹34,999/month
 */
const calculateEnterpriseCommitmentBreakdown = (eligibleGMV, baseCommissionOverride = null) => {
  const gmv = Math.max(0, Number(eligibleGMV) || 0);
  const commissionRate = 6; // 6%
  const minimumCommitment = 20000; // ₹20,000
  const subscriptionAmount = 14999; // ₹14,999

  const calculatedCommission =
    baseCommissionOverride !== null
      ? Math.round(Number(baseCommissionOverride) * 100) / 100
      : Math.round((gmv * commissionRate) / 100 * 100) / 100;

  const commitmentAdjustment = Math.max(
    0,
    Math.round((minimumCommitment - calculatedCommission) * 100) / 100
  );

  const totalPlatformCommitment = Math.max(calculatedCommission, minimumCommitment);

  const totalPlatformRevenue = Math.round((subscriptionAmount + totalPlatformCommitment) * 100) / 100;

  return {
    eligibleGMV: gmv,
    commissionRate,
    calculatedCommission,
    minimumCommitment,
    commitmentAdjustment,
    totalPlatformCommitment,
    subscriptionAmount,
    totalPlatformRevenue,
  };
};

/**
 * Run Monthly Enterprise Settlement (IDEMPOTENT)
 * Closed at month-end for Enterprise vendors.
 */
const runEnterpriseMonthlySettlement = async (vendorId, year, month) => {
  const vendor = await Vendor.findById(vendorId);
  if (!vendor) {
    throw new Error("Vendor not found");
  }

  // Define billing period dates (1st of month 00:00:00 to last day 23:59:59)
  const billingPeriodStart = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
  const billingPeriodEnd = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

  // Calculate eligible GMV and order stats
  const { eligibleGMV, baseCommissionGenerated } = await calculateMonthlyGMV(
    vendorId,
    billingPeriodStart,
    billingPeriodEnd
  );

  const breakdown = calculateEnterpriseCommitmentBreakdown(
    eligibleGMV,
    baseCommissionGenerated
  );

  // Check if settlement already exists for idempotency
  let settlement = await EnterpriseSettlement.findOne({
    vendor: vendorId,
    year,
    month,
  });

  const isEnterprise =
    vendor.subscription?.plan === "enterprise" ||
    vendor.pricingTier === "enterprise";

  const invoiceId = `INV-ENT-${year}${String(month).padStart(2, "0")}-${vendorId.toString().slice(-6).toUpperCase()}`;

  if (!settlement) {
    settlement = new EnterpriseSettlement({
      vendor: vendorId,
      plan: isEnterprise ? "enterprise" : (vendor.subscription?.plan || "starter"),
      year,
      month,
      billingPeriodStart,
      billingPeriodEnd,
      eligibleGMV: breakdown.eligibleGMV,
      commissionRate: breakdown.commissionRate,
      baseCommission: breakdown.calculatedCommission,
      minimumCommitment: breakdown.minimumCommitment,
      commitmentAdjustment: breakdown.commitmentAdjustment,
      totalPlatformCommitment: breakdown.totalPlatformCommitment,
      subscriptionAmount: breakdown.subscriptionAmount,
      totalPlatformRevenue: breakdown.totalPlatformRevenue,
      status: breakdown.commitmentAdjustment > 0 ? "COMMITMENT_INVOICED" : "COMMITMENT_PAID",
      invoiceId,
    });
  } else {
    // Update non-finalized settlement values
    if (!settlement.isFinalized) {
      settlement.eligibleGMV = breakdown.eligibleGMV;
      settlement.baseCommission = breakdown.calculatedCommission;
      settlement.commitmentAdjustment = breakdown.commitmentAdjustment;
      settlement.totalPlatformCommitment = breakdown.totalPlatformCommitment;
      settlement.totalPlatformRevenue = breakdown.totalPlatformRevenue;
    }
  }

  // Record collectible transaction in vendor wallet ledger if adjustment is due
  if (breakdown.commitmentAdjustment > 0 && settlement.status === "COMMITMENT_INVOICED") {
    // Post transaction to vendor wallet ledger
    const shortfallAmount = breakdown.commitmentAdjustment;
    const existingTx = vendor.wallet?.transactions?.find(
      (tx) => tx.description && tx.description.includes(invoiceId)
    );

    if (!existingTx) {
      if (!vendor.wallet) {
        vendor.wallet = { balance: 0, transactions: [] };
      }
      vendor.wallet.balance = (vendor.wallet.balance || 0) - shortfallAmount;
      vendor.wallet.totalCommissionPaid = (vendor.wallet.totalCommissionPaid || 0) + shortfallAmount;
      vendor.wallet.transactions.push({
        type: "commitment_shortfall",
        amount: shortfallAmount,
        description: `Enterprise Minimum Commitment Shortfall Adjustment (${invoiceId})`,
        status: "completed",
        balanceAfter: vendor.wallet.balance,
        createdAt: new Date(),
      });
      await vendor.save();
    }
    settlement.status = "COMMITMENT_PAID";
    settlement.paidAt = new Date();
    settlement.isFinalized = true;
    settlement.finalizedAt = new Date();
  } else if (breakdown.commitmentAdjustment === 0) {
    settlement.status = "COMMITMENT_PAID";
    settlement.paidAt = new Date();
    settlement.isFinalized = true;
    settlement.finalizedAt = new Date();
  }

  await settlement.save();

  return {
    settlement,
    breakdown,
  };
};

/**
 * Get current real-time month commitment status for vendor dashboard.
 */
const getEnterpriseCommitmentStatus = async (vendorId) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const billingPeriodStart = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
  const billingPeriodEnd = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

  const { eligibleGMV, baseCommissionGenerated, eligibleOrderCount } = await calculateMonthlyGMV(
    vendorId,
    billingPeriodStart,
    billingPeriodEnd
  );

  const breakdown = calculateEnterpriseCommitmentBreakdown(
    eligibleGMV,
    baseCommissionGenerated
  );

  // Calculate threshold remaining to hit ₹20,000 commission target (which occurs at GMV = ₹3,33,333.33)
  const breakEvenGMV = 333333.33;
  const remainingGMVForCommitmentCover = Math.max(
    0,
    Math.round((breakEvenGMV - eligibleGMV) * 100) / 100
  );

  return {
    year,
    month,
    billingPeriodStart,
    billingPeriodEnd,
    eligibleOrderCount,
    ...breakdown,
    breakEvenGMV,
    remainingGMVForCommitmentCover,
  };
};

module.exports = {
  calculateMonthlyGMV,
  calculateEnterpriseCommitmentBreakdown,
  runEnterpriseMonthlySettlement,
  getEnterpriseCommitmentStatus,
};
