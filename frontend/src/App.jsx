import React, { lazy, Suspense, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import SEO from "./components/SEO";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import SirabaAssistant from "./components/SirabaAssistant";
import { CartProvider } from "./context/CartContext";
import { ProductProvider } from "./context/ProductContext";
import { AuthProvider } from "./context/AuthContext";
import { OrderProvider } from "./context/OrderContext";
import { VendorProvider } from "./context/VendorContext";
import { SocketProvider } from "./context/SocketContext";
import { CurrencyProvider } from "./context/CurrencyContext";
import { ToastProvider } from "./components/Toast";
import { ConfirmProvider } from "./components/ConfirmModal";
import { trackPageView, initGlobalAnalyticsListeners } from "./utils/analytics";
import Shop from "./pages/Shop";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import About from "./pages/About";
import FounderFAQs from "./pages/FounderFAQs";
import OrganicCertificationGuide from "./pages/OrganicCertificationGuide";
import WhySiraba from "./pages/WhySiraba";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Certification from "./pages/Certification";
import B2B from "./pages/B2B";
import Account from "./pages/Account";
import Contact from "./pages/Contact";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Terms from "./pages/Terms";
import ShippingPolicy from "./pages/ShippingPolicy";
import RefundPolicy from "./pages/RefundPolicy";
import FAQ from "./pages/FAQ";
import QualityPromise from "./pages/QualityPromise";
import ProductVerification from "./pages/ProductVerification";
import TrackOrder from "./pages/TrackOrder";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VendorShopPage from "./pages/VendorShopPage";

// Heavy Admin & Vendor Portals (Lazy-loaded to keep main bundle lean)
const AdminLogin = lazy(() => import("./pages/admin/Login"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const VendorOnboarderDashboard = lazy(() => import("./pages/admin/VendorOnboarderDashboard"));
const BlogCreatorDashboard = lazy(() => import("./pages/admin/BlogCreatorDashboard"));
const AdminBlogList = lazy(() => import("./pages/admin/AdminBlogList"));
const AdminBlogEdit = lazy(() => import("./pages/admin/AdminBlogEdit"));

const VendorLogin = lazy(() => import("./pages/vendor/VendorLogin"));
const VendorDashboard = lazy(() => import("./pages/vendor/VendorDashboard"));
const VendorOnboarding = lazy(() => import("./pages/vendor/VendorOnboarding"));
const VendorUnderReview = lazy(() => import("./pages/vendor/VendorUnderReview"));
const VendorRejected = lazy(() => import("./pages/vendor/VendorRejected"));
const VendorSubscription = lazy(() => import("./pages/vendor/VendorSubscription"));
const VendorQualification = lazy(() => import("./pages/VendorQualification"));
const VendorIntro = lazy(() => import("./pages/vendor/VendorIntro"));
const VendorBenefits = lazy(() => import("./pages/vendor/VendorBenefits"));
const VendorOnboardingGuide = lazy(() => import("./pages/vendor/VendorOnboardingGuide"));
const VendorOnboardingChecklist = lazy(() => import("./pages/vendor/VendorOnboardingChecklist"));
const VendorVerificationPolicies = lazy(() => import("./pages/vendor/VendorVerificationPolicies"));
const VendorTermsAndConditions = lazy(() => import("./pages/vendor/VendorTermsAndConditions"));
const VendorFAQ = lazy(() => import("./pages/vendor/VendorFAQ"));
const MarketplaceBadges = lazy(() => import("./pages/MarketplaceBadges"));

const RouteTracker = () => {
  const location = useLocation();

  useEffect(() => {
    initGlobalAnalyticsListeners();
  }, []);

  useEffect(() => {
    trackPageView(location);
  }, [location.pathname, location.search]);

  return null;
};

const FooterWrapper = () => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin") || location.pathname.startsWith("/vendor-onboarder") || location.pathname.startsWith("/blog-creator");
  const isVendorPortal = location.pathname === "/vendor" || location.pathname.startsWith("/vendor/");
  return !isAdmin && !isVendorPortal ? <Footer /> : null;
};

const NavbarWrapper = () => {
  const location = useLocation();
  const isVendorPortal = location.pathname === "/vendor" || location.pathname.startsWith("/vendor/");
  const isSubAdmin = location.pathname.startsWith("/vendor-onboarder") || location.pathname.startsWith("/blog-creator") || location.pathname.startsWith("/admin");
  return !isVendorPortal && !isSubAdmin ? <Navbar /> : null;
};

function App() {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <SocketProvider>
          <AuthProvider>
            <VendorProvider>
              <CurrencyProvider>
                <ProductProvider>
                  <OrderProvider>
                    <CartProvider>
                      <Router>
                        <RouteTracker />
                        <div className="flex flex-col min-h-screen font-body text-text-primary bg-background selection:bg-accent selection:text-primary">
                          <NavbarWrapper />
                          <main className="flex-grow">
                            <Suspense fallback={null}>
                              <Routes>
                              <Route path="/" element={<Home />} />
                              <Route path="/shop" element={<Shop />} />
                              <Route
                                path="/shop/vendor/:slug"
                                element={<VendorShopPage />}
                              />
                              <Route
                                path="/product/:slug"
                                element={<ProductDetails />}
                              />
                              <Route path="/cart" element={<Cart />} />

                              <Route path="/quality-promise" element={<QualityPromise />} />
                              <Route path="/verify/:traceId" element={<ProductVerification />} />
                              <Route path="/about" element={<About />} />
                              <Route path="/about-us" element={<Navigate to="/about" replace />} />
                              <Route path="/our-story" element={<Navigate to="/about" replace />} />
                              <Route
                                path="/founder-faqs"
                                element={<FounderFAQs />}
                              />
                              <Route
                                path="/organic-certification-guide"
                                element={<OrganicCertificationGuide />}
                              />
                              <Route
                                path="/why-siraba"
                                element={<WhySiraba />}
                              />
                              <Route
                                path="/certifications"
                                element={<Certification />}
                              />
                              <Route
                                path="/certification"
                                element={<Navigate to="/certifications" replace />}
                              />
                              <Route path="/b2b" element={<B2B />} />
                              <Route path="/blog" element={<Blog />} />
                              <Route
                                path="/blog/:slug"
                                element={<BlogPost />}
                              />
                              <Route path="/contact" element={<Contact />} />
                              <Route path="/contact-us" element={<Navigate to="/contact" replace />} />
                              <Route
                                path="/privacy-policy"
                                element={<PrivacyPolicy />}
                              />
                              <Route path="/terms" element={<Terms />} />
                              <Route
                                path="/shipping-policy"
                                element={<ShippingPolicy />}
                              />
                              <Route
                                path="/refund-policy"
                                element={<RefundPolicy />}
                              />
                              <Route path="/faq" element={<FAQ />} />
                              <Route path="/account" element={<Account />} />
                              <Route path="/login" element={<Login />} />
                              <Route
                                path="/track-order"
                                element={<TrackOrder />}
                              />
                              <Route path="/checkout" element={<Checkout />} />
                              <Route
                                path="/order-success"
                                element={<OrderSuccess />}
                              />
                              <Route
                                path="/forgot-password"
                                element={<ForgotPassword />}
                              />
                              <Route
                                path="/reset-password/:resetToken"
                                element={<ResetPassword />}
                              />

                              {/* Admin Routes */}
                              <Route path="/admin" element={<AdminLogin />} />
                              <Route
                                path="/admin/dashboard"
                                element={<AdminDashboard />}
                              />
                              <Route
                                path="/vendor-onboarder/dashboard"
                                element={<VendorOnboarderDashboard />}
                              />
                              <Route
                                path="/blog-creator/dashboard"
                                element={<BlogCreatorDashboard />}
                              />
                              <Route
                                path="/admin/blogs"
                                element={<AdminBlogList />}
                              />
                              <Route
                                path="/admin/blogs/new"
                                element={<AdminBlogEdit />}
                              />
                              <Route
                                path="/admin/blogs/edit/:id"
                                element={<AdminBlogEdit />}
                              />

                              {/* Vendor Portal Routes */}
                              <Route path="/vendor" element={<VendorIntro />} />
                              <Route
                                path="/vendor/intro"
                                element={<Navigate to="/vendor" replace />}
                              />
                              <Route
                                path="/vendor-intro"
                                element={<Navigate to="/vendor" replace />}
                              />
                              <Route
                                path="/vendor/login"
                                element={<VendorLogin />}
                              />
                              <Route
                                path="/vendor/register"
                                element={<VendorLogin />}
                              />
                              <Route
                                path="/vendor/onboarding"
                                element={<VendorOnboarding />}
                              />
                              <Route
                                path="/vendor/under-review"
                                element={<VendorUnderReview />}
                              />
                              <Route
                                path="/vendor/rejected"
                                element={<VendorRejected />}
                              />
                              <Route
                                path="/vendor/dashboard"
                                element={<VendorDashboard />}
                              />
                              <Route
                                path="/vendor/subscription"
                                element={<VendorSubscription />}
                              />
                              <Route
                                path="/vendor-benefits"
                                element={<VendorBenefits />}
                              />
                              <Route
                                path="/vendor-qualification"
                                element={<VendorQualification />}
                              />
                              <Route
                                path="/vendor/qualification"
                                element={<Navigate to="/vendor-qualification" replace />}
                              />
                              <Route
                                path="/vendor-onboarding-guide"
                                element={<VendorOnboardingGuide />}
                              />
                              <Route
                                path="/vendor-onboarding-checklist"
                                element={<VendorOnboardingChecklist />}
                              />
                              <Route
                                path="/vendor-verification-policies"
                                element={<VendorVerificationPolicies />}
                              />
                              <Route
                                path="/vendor-terms-and-conditions"
                                element={<VendorTermsAndConditions />}
                              />
                              <Route
                                path="/vendor-faq"
                                element={<VendorFAQ />}
                              />
                              <Route path="/vendor/badges" element={<MarketplaceBadges />} />
                              <Route
                                path="/marketplace-badges"
                                element={<Navigate to="/vendor/badges" replace />}
                              />

                              {/* Placeholder Routes - To be implemented */}
                              <Route
                                path="/saffron"
                                element={
                                  <div className="pt-32 text-center h-screen flex items-center justify-center text-xl font-heading text-primary">
                                    Saffron Details (Coming Soon)
                                  </div>
                                }
                              />
                              <Route
                                path="/traceability"
                                element={
                                  <div className="pt-32 text-center h-screen flex items-center justify-center text-xl font-heading text-primary">
                                    Traceability (Coming Soon)
                                  </div>
                                }
                              />
                              <Route
                                path="/journal"
                                element={
                                  <div className="pt-32 text-center h-screen flex items-center justify-center text-xl font-heading text-primary">
                                    Journal (Coming Soon)
                                  </div>
                                }
                              />

                              {/* Legacy Redirect Fallback */}
                              <Route
                                path="/certification.html"
                                element={<Navigate to="/certifications" replace />}
                              />

                              {/* 404 Route */}
                              <Route
                                path="*"
                                element={
                                  <div className="pt-32 text-center h-screen flex flex-col items-center justify-center text-xl font-heading text-primary">
                                    <SEO title="404 - Page Not Found | Siraba Organic" noindex={true} />
                                    <h1 className="text-4xl font-bold mb-4">404</h1>
                                    <p className="text-lg text-slate-600 font-sans mb-6">Page Not Found</p>
                                    <a href="/" className="text-sm font-sans underline text-[#0F3D2E]">Return to Homepage</a>
                                  </div>
                                }
                              />
                            </Routes>
                            </Suspense>
                          </main>
                          <SirabaAssistant />
                          <FooterWrapper />
                        </div>
                      </Router>
                    </CartProvider>
                  </OrderProvider>
                </ProductProvider>
              </CurrencyProvider>
            </VendorProvider>
          </AuthProvider>
        </SocketProvider>
      </ConfirmProvider>
    </ToastProvider>
  );
}

export default App;
