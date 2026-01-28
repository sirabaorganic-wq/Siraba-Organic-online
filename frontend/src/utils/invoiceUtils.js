// Invoice download utility function
export const downloadInvoice = async (orderId) => {
    try {
        const token = localStorage.getItem('token');
        const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

        const response = await fetch(`${baseURL.replace('/api', '')}/api/invoices/${orderId}/download`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to download invoice');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Invoice-${orderId.slice(-8).toUpperCase()}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        return true;
    } catch (error) {
        console.error('Invoice download error:', error);
        throw error;
    }
};

// Preview invoice in new tab
export const previewInvoice = (orderId) => {
    const token = localStorage.getItem('token');
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

    const url = `${baseURL.replace('/api', '')}/api/invoices/${orderId}/preview`;
    const newWindow = window.open('', '_blank');

    // Fetch with auth and then set the content
    fetch(url, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
        .then(response => response.text())
        .then(html => {
            newWindow.document.write(html);
            newWindow.document.close();
        })
        .catch(error => {
            console.error('Invoice preview error:', error);
            newWindow.close();
            alert('Failed to preview invoice');
        });
};
