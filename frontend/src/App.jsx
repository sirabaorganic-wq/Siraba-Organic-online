import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import About from "./pages/About";
import WhySiraba from "./pages/WhySiraba";
import Blog from "./pages/Blog";
import Certification from "./pages/Certification";
import B2B from "./pages/B2B";
import Account from "./pages/Account";
import Shop from "./pages/Shop";
import Contact from "./pages/Contact";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import { CartProvider } from "./context/CartContext";
import { ProductProvider } from "./context/ProductContext";
import { AuthProvider } from "./context/AuthContext";
import { OrderProvider } from "./context/OrderContext";
import { VendorProvider } from "./context/VendorContext";
import AdminLogin from "./pages/admin/Login";
import AdminDashboard from "./pages/admin/Dashboard";
import VendorLogin from "./pages/vendor/VendorLogin";
import VendorDashboard from "./pages/vendor/VendorDashboard";
import VendorOnboarding from "./pages/vendor/VendorOnboarding";
import VendorSubscription from "./pages/vendor/VendorSubscription";
import Login from "./pages/Login";
import TrackOrder from "./pages/TrackOrder";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import BlogPost from "./pages/BlogPost";
import AdminBlogList from "./pages/admin/AdminBlogList";
import AdminBlogEdit from "./pages/admin/AdminBlogEdit";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VendorShopPage from "./pages/VendorShopPage";
import VendorIntro from "./pages/vendor/VendorIntro";
import { SocketProvider } from "./context/SocketContext";
import { CurrencyProvider } from "./context/CurrencyContext";
import { ToastProvider } from "./components/Toast";
import { ConfirmProvider } from "./components/ConfirmModal";

const FooterWrapper = () => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");
  const isVendor = location.pathname.startsWith("/vendor");
  return !isAdmin && !isVendor ? <Footer /> : null;
};

const NavbarWrapper = () => {
  const location = useLocation();
  const isVendor = location.pathname.startsWith("/vendor");
  return !isVendor ? <Navbar /> : null;
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
                        <div className="flex flex-col min-h-screen font-body text-text-primary bg-background selection:bg-accent selection:text-primary">
                          <NavbarWrapper />
                          <main className="flex-grow">
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

                              <Route path="/our-story" element={<About />} />
                              <Route path="/about-us" element={<About />} />
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
                                element={<Certification />}
                              />
                              <Route path="/b2b" element={<B2B />} />
                              <Route path="/blog" element={<Blog />} />
                              <Route
                                path="/blog/:slug"
                                element={<BlogPost />}
                              />
                              <Route path="/contact" element={<Contact />} />
                              <Route path="/contact-us" element={<Contact />} />
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
                              <Route path="/vendor/intro" element={<VendorIntro />} />
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
                                path="/vendor/dashboard"
                                element={<VendorDashboard />}
                              />
                              <Route
                                path="/vendor/subscription"
                                element={<VendorSubscription />}
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

                              {/* 404 Route */}
                              <Route
                                path="*"
                                element={
                                  <div className="pt-32 text-center h-screen flex items-center justify-center text-xl font-heading text-primary">
                                    404 - Page Not Found
                                  </div>
                                }
                              />
                            </Routes>
                          </main>
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
