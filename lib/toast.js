// lib/toast.js
import { toast } from 'react-toastify';

export const showToast = {
    success: (message) => toast.success(message),
    error: (message) => toast.error(message),
    warning: (message) => toast.warning(message),
    info: (message) => toast.info(message),
};