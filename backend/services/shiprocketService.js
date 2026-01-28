// MOCK Shiprocket Service
// Simulating Shiprocket API behavior for testing

const axios = require('axios');

class ShiprocketService {
    constructor() {
        this.token = null;
        this.baseUrl = "https://apiv2.shiprocket.in/v1/external";
    }

    // Simulate login
    async login() {
        // In a real implementation, we would call the API.
        // Here we just mock a token.
        this.token = "mock_shiprocket_token_" + Date.now();
        return this.token;
    }

    // Create Order (Mock)
    async createOrder(orderDetails) {
        if (!this.token) await this.login();

        console.log("MOCK SHIPROCKET: Creating Order", orderDetails.order_id);

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Return mock success response
        return {
            order_id: 1000 + Math.floor(Math.random() * 9000),
            shipment_id: 2000 + Math.floor(Math.random() * 9000),
            status: "NEW", // Shiprocket initial status
            status_code: 1,
            onboarding_completed_now: 0,
            awb_code: "AWB" + Date.now(),
            courier_company_id: "1",
            courier_name: "Mock Courier Express"
        };
    }

    // Cancel Order (Mock)
    async cancelOrder(awbCode) {
        if (!this.token) await this.login();

        console.log("MOCK SHIPROCKET: Cancelling Order AWB", awbCode);

        await new Promise(resolve => setTimeout(resolve, 500));

        return {
            status_code: 200,
            message: "Order cancelled successfully",
            awb: awbCode
        };
    }

    // Track Order (Mock)
    async trackOrder(awbCode) {
        if (!this.token) await this.login();

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 300));

        // Random status for demo/testing if not stored
        const statuses = ["PICKED UP", "IN TRANSIT", "OUT FOR DELIVERY", "DELIVERED"];
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

        return {
            tracking_data: {
                track_status: 1,
                shipment_status: 7, // Delivered status code example
                shipment_track: [
                    {
                        "current_status": randomStatus,
                        "awb_code": awbCode,
                        "courier_name": "Mock Courier Express",
                        "origin": "Vendor City",
                        "destination": "User City"
                    }
                ]
            }
        };
    }

    // Custom method to Generate Return (Mock)
    async createReturnOrder(returnDetails) {
        if (!this.token) await this.login();

        console.log("MOCK SHIPROCKET: Creating Return Order", returnDetails.order_id);

        await new Promise(resolve => setTimeout(resolve, 500));

        return {
            shipment_id: 3000 + Math.floor(Math.random() * 9000),
            status: "RETURN INITIATED",
            awb_code: "RET" + Date.now()
        }
    }

}

module.exports = new ShiprocketService();
