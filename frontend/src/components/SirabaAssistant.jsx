import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, User, Bot, Loader2, ChevronDown } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const quickReplies = [
    { text: "Track my order", intent: "track" },
    { text: "Shop products", intent: "shop" },
    { text: "Become a vendor", intent: "vendor" },
    { text: "Contact support", intent: "contact" }
];

const initialMessages = [
    {
        id: 'welcome-1',
        sender: 'assistant',
        text: "Hello! I'm Siraba Assistant. How can I help you today?",
        timestamp: new Date().toISOString()
    }
];

export default function SirabaAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState(initialMessages);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [showQuickReplies, setShowQuickReplies] = useState(true);
    const messagesEndRef = useRef(null);
    const location = useLocation();

    // Auto-scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen, isTyping]);

    // Simple rule-based logic engine
    const processMessage = (userText) => {
        const text = userText.toLowerCase();
        let responseText = "";
        let actionLink = null;
        let actionText = "";

        if (text.includes('track') || text.includes('order') || text.includes('shipment') || text.includes('delivery')) {
            responseText = "You can track your order status on our tracking page. You'll need your Order ID or tracking number.";
            actionLink = "/track-order";
            actionText = "Go to Order Tracking";
        } else if (text.includes('vendor') || text.includes('sell') || text.includes('onboard')) {
            responseText = "We'd love to have you as a vendor! You can register and start onboarding right away.";
            actionLink = "/vendor/register";
            actionText = "Become a Vendor";
        } else if (text.includes('shop') || text.includes('buy') || text.includes('product') || text.includes('saffron') || text.includes('spice')) {
            responseText = "Check out our organic products in the shop. We have premium saffron, spices, and more.";
            actionLink = "/shop";
            actionText = "Shop Now";
        } else if (text.includes('cart') || text.includes('checkout') || text.includes('payment')) {
            responseText = "Ready to complete your purchase? Head over to your cart and proceed to checkout.";
            actionLink = "/cart";
            actionText = "View Cart";
        } else if (text.includes('blog') || text.includes('article') || text.includes('info') || text.includes('read')) {
            responseText = "Learn more about our organic farming practices and products on our blog.";
            actionLink = "/blog";
            actionText = "Read the Blog";
        } else if (text.includes('b2b') || text.includes('bulk') || text.includes('wholesale')) {
            responseText = "For wholesale or bulk inquiries, please visit our B2B section.";
            actionLink = "/b2b";
            actionText = "B2B Information";
        } else if (text.includes('account') || text.includes('login') || text.includes('register') || text.includes('password')) {
            responseText = "You can manage your account, view past orders, and update details in your dashboard.";
            actionLink = "/account";
            actionText = "Go to My Account";
        } else if (text.includes('contact') || text.includes('support') || text.includes('help')) {
            responseText = "If you need further assistance, our support team is happy to help.";
            actionLink = "/contact";
            actionText = "Contact Support";
        } else if (text.includes('certif') || text.includes('organic')) {
            responseText = "All our products meet strict organic certification standards. You can read more about it here.";
            actionLink = "/certifications";
            actionText = "View Certifications";
        } else {
            responseText = "I can help you navigate the shop, track orders, or learn about becoming a vendor. For more specific questions, please contact our support team.";
            actionLink = "/contact";
            actionText = "Contact Support";
        }

        return { text: responseText, actionLink, actionText };
    };

    const handleSend = (text) => {
        if (!text.trim()) return;

        setShowQuickReplies(false);

        // Add user message
        const newUserMsg = {
            id: Date.now().toString(),
            sender: 'user',
            text: text,
            timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, newUserMsg]);
        setInputValue('');
        setIsTyping(true);

        // Simulate network/thinking delay (500ms - 1000ms)
        const delay = Math.random() * 500 + 500;

        setTimeout(() => {
            const response = processMessage(text);
            const newAssistantMsg = {
                id: (Date.now() + 1).toString(),
                sender: 'assistant',
                text: response.text,
                actionLink: response.actionLink,
                actionText: response.actionText,
                timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, newAssistantMsg]);
            setIsTyping(false);
        }, delay);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSend(inputValue);
        }
    };

    // Hide if on admin or vendor pages
    if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/vendor')) {
        return null;
    }

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
            {/* Chat Panel */}
            {isOpen && (
                <div className="pointer-events-auto bg-surface w-[350px] max-w-[calc(100vw-32px)] h-[500px] max-h-[calc(100vh-120px)] rounded-2xl shadow-2xl border border-secondary/20 flex flex-col mb-4 overflow-hidden animate-chat-slide-up origin-bottom-right">

                    {/* Header */}
                    <div className="bg-primary text-white p-4 flex justify-between items-center shadow-md z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                <Bot size={20} className="text-white" />
                            </div>
                            <div>
                                <h3 className="font-heading font-bold text-lg leading-tight">Siraba Assistant</h3>
                                <div className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-green-400"></span>
                                    <span className="text-xs text-white/80">Online</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-white/80 hover:text-white transition-colors hover:bg-white/10 p-1 rounded-md"
                        >
                            <ChevronDown size={24} />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 bg-background/50 chat-scrollbar flex flex-col gap-4">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                            >
                                <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm ${msg.sender === 'user'
                                    ? 'bg-accent text-primary rounded-tr-sm'
                                    : 'bg-white border border-secondary/10 text-text-primary rounded-tl-sm'
                                    }`}>
                                    <p className="whitespace-pre-wrap">{msg.text}</p>

                                    {/* Action Button inside Message */}
                                    {msg.actionLink && (
                                        <div className="mt-3 mb-1">
                                            <Link
                                                to={msg.actionLink}
                                                onClick={() => setIsOpen(false)} // Optional: close chat when navigating
                                                className="inline-block px-4 py-2 bg-primary text-white hover:bg-primary/90 rounded-full text-xs font-bold transition-colors shadow-sm"
                                            >
                                                {msg.actionText}
                                            </Link>
                                        </div>
                                    )}

                                    <span className={`text-[10px] block mt-1 ${msg.sender === 'user' ? 'text-primary/60 text-right' : 'text-text-secondary/60'}`}>
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        ))}

                        {/* Typing Indicator */}
                        {isTyping && (
                            <div className="flex justify-start animate-fade-in">
                                <div className="bg-white border border-secondary/10 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm h-[36px] flex items-center">
                                    <div className="flex gap-1">
                                        <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce-dot [animation-delay:-0.3s]"></div>
                                        <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce-dot [animation-delay:-0.15s]"></div>
                                        <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce-dot"></div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Quick Replies */}
                        {showQuickReplies && messages.length === 1 && (
                            <div className="flex flex-wrap gap-2 mt-2 animate-fade-in">
                                {quickReplies.map((reply, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleSend(reply.text)}
                                        className="text-xs bg-white border border-accent/30 text-primary hover:bg-accent/10 px-3 py-1.5 rounded-full transition-colors shadow-sm font-medium"
                                    >
                                        {reply.text}
                                    </button>
                                ))}
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="bg-white border-t border-secondary/20 p-3">
                        <div className="flex items-center gap-2 bg-background border border-secondary/20 rounded-full px-4 py-1.5 focus-within:border-accent focus-within:ring-1 focus-within:ring-accent/50 transition-all">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyPress}
                                placeholder="Type a message..."
                                className="flex-1 bg-transparent border-none focus:outline-none text-sm py-2 disabled:opacity-50"
                                disabled={isTyping}
                            />
                            <button
                                onClick={() => handleSend(inputValue)}
                                disabled={!inputValue.trim() || isTyping}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-primary text-white disabled:bg-primary/50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors shrink-0"
                            >
                                <Send size={14} className="ml-0.5" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Toggle Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="pointer-events-auto group bg-primary text-white w-14 h-14 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center border-[3px] border-white/20 hover:border-accent"
                    aria-label="Open support chat"
                >
                    <MessageSquare size={24} className="group-hover:hidden" />
                    <Bot size={24} className="hidden group-hover:block animate-fade-in" />

                    {/* Notification Dot */}
                    <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-accent border-2 border-white rounded-full"></span>
                </button>
            )}
        </div>
    );
}
