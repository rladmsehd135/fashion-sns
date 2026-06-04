import React from 'react';
import toast from 'react-hot-toast';

const confirmToast = (message, onConfirm, opts = {}) => {
  const { confirmText = '삭제', cancelText = '취소', danger = true } = opts;

  toast(
    (t) =>
      React.createElement(
        'div',
        { style: { minWidth: 220 } },
        React.createElement(
          'p',
          { style: { margin: '0 0 12px', fontSize: 13, color: '#EFEFEF', lineHeight: 1.5 } },
          message
        ),
        React.createElement(
          'div',
          { style: { display: 'flex', gap: 8 } },
          React.createElement(
            'button',
            {
              onClick: () => { toast.dismiss(t.id); onConfirm(); },
              style: {
                flex: 1, padding: '7px 0', border: 'none', borderRadius: 8,
                cursor: 'pointer', fontWeight: 700, fontSize: 13,
                backgroundColor: danger ? '#FF4D6D' : '#E8C96D',
                color: danger ? '#fff' : '#0A0A0A',
              },
            },
            confirmText
          ),
          React.createElement(
            'button',
            {
              onClick: () => toast.dismiss(t.id),
              style: {
                flex: 1, padding: '7px 0', border: '1px solid #333',
                borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13,
                backgroundColor: 'transparent', color: '#A0A0A0',
              },
            },
            cancelText
          )
        )
      ),
    {
      duration: Infinity,
      style: {
        background: '#1A1A1A',
        border: '1px solid #2A2A2A',
        borderRadius: 12,
        padding: '14px 16px',
        maxWidth: 300,
      },
    }
  );
};

export default confirmToast;
