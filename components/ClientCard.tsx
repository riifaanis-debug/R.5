
import React, { useEffect, useState } from 'react';

const ClientCard: React.FC = () => {
  const [data, setData] = useState({
    name: 'اسم العميل',
    file: 'RF-00000000-0000',
    id: '10XXXXXXXXX',
    mobile: '9665XXXXXXXX',
    url: ''
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.split('?')[1] || window.location.search);
    const name = params.get("name") || "اسم العميل";
    const file = params.get("file") || "RF-00000000-0000";
    const id = params.get("id") || "10XXXXXXXXX";
    const mobile = params.get("mobile") || "9665XXXXXXXX";
    const url = params.get("url") || (window.location.origin + "/#/client-card?file=" + file + "&name=" + encodeURIComponent(name));

    setData({ name, file, id, mobile, url });
  }, []);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert("تم نسخ رابط البطاقة ✅");
    } catch (e) {
      alert("تعذر النسخ. انسخ الرابط يدوياً من شريط العنوان.");
    }
  };

  const handleCopyData = async () => {
    const text = `NAME: ${data.name}\nFILE: ${data.file}\nID: ${data.id}\nMOBILE: ${data.mobile}\nURL: ${data.url}`;
    try {
      await navigator.clipboard.writeText(text);
      alert("تم نسخ بيانات العميل ✅");
    } catch (e) {
      alert("تعذر النسخ.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0b16] flex flex-col items-center justify-center p-6 font-['Tajawal']" dir="rtl">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800&display=swap');
        
        .rifans-card {
          width: 100%;
          max-width: 420px;
          padding: 24px;
          border-radius: 22px;
          background: linear-gradient(145deg, #22042C, #3a0a55);
          color: white;
          direction: rtl;
          font-family: Tajawal, sans-serif;
          box-shadow: 0 20px 40px rgba(0,0,0,0.4);
        }

        .card-header {
          margin-bottom: 24px;
          text-align: center;
        }

        .card-header h2 {
          font-weight: 800;
          font-size: 24px;
          color: #C7A969;
          margin: 0;
          line-height: 1.2;
        }

        .card-header span {
          font-weight: 700;
          font-size: 12px;
          color: #C7A969;
          letter-spacing: 0.1em;
          opacity: 0.8;
          text-transform: uppercase;
        }

        .card-data {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .row {
          display: flex;
          justify-content: flex-start;
          gap: 6px;
          text-align: right;
        }

        .label {
          color: #C7A969;
          font-weight: 600;
        }

        .value {
          color: white;
        }

        .actions-bar {
          margin-top: 32px;
          display: flex;
          gap: 16px;
          justify-content: center;
          width: 100%;
          max-width: 420px;
        }

        .action-btn {
          flex: 1;
          background: rgba(199, 169, 105, 0.1);
          border: 1px solid rgba(199, 169, 105, 0.3);
          color: #C7A969;
          padding: 12px 16px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s;
          backdrop-filter: blur(10px);
          text-align: center;
        }

        .action-btn:hover {
          background: rgba(199, 169, 105, 0.2);
          transform: translateY(-2px);
        }
      `}</style>

      <div className="rifans-card">
        <div className="card-header">
          <h2>ريفانس المالية</h2>
          <span>RIFANIS FINANCE</span>
        </div>

        <div className="card-data">
          <div className="row">
            <span className="label">الاسم:</span>
            <span className="value">{data.name}</span>
          </div>

          <div className="row">
            <span className="label">رقم الملف:</span>
            <span className="value">{data.file}</span>
          </div>

          <div className="row">
            <span className="label">رقم الهوية:</span>
            <span className="value">{data.id}</span>
          </div>

          <div className="row">
            <span className="label">رقم الجوال:</span>
            <span className="value">{data.mobile}</span>
          </div>
        </div>
      </div>

      <div className="actions-bar">
        <button className="action-btn" onClick={handleCopyLink}>نسخ رابط البطاقة</button>
        <button className="action-btn" onClick={handleCopyData}>نسخ بيانات العميل</button>
      </div>
    </div>
  );
};

export default ClientCard;
