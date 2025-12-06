import { useState } from 'react';
import { CreditCard, ExternalLink, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ServiceFeePaymentProps {
  groupId: string;
  groupName: string;
  serviceFee: number;
  servicePaid: boolean;
  deadline: string | null;
  onPaymentConfirmed: () => void;
}

export const ServiceFeePayment = ({
  groupId,
  groupName,
  serviceFee,
  servicePaid,
  deadline,
  onPaymentConfirmed,
}: ServiceFeePaymentProps) => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'paypal' | 'interac' | 'cash'>('paypal');

  const isOverdue = deadline && new Date(deadline) < new Date();
  const daysRemaining = deadline
    ? Math.ceil((new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const handleConfirmPayment = async () => {
    setConfirming(true);
    try {
      const { error } = await supabase
        .from('likelemba_groups')
        .update({
          service_fee_paid: true,
          service_fee_paid_at: new Date().toISOString(),
          service_fee_payment_method: paymentMethod,
        })
        .eq('id', groupId);

      if (error) throw error;

      alert('Service fee payment confirmed!');
      setShowPaymentModal(false);
      onPaymentConfirmed();
    } catch (error: any) {
      console.error('Error confirming payment:', error);
      alert('Failed to confirm payment. Please try again.');
    } finally {
      setConfirming(false);
    }
  };

  if (servicePaid) {
    return (
      <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
        <div className="flex items-start">
          <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-green-900 mb-1">Service Fee Paid</h4>
            <p className="text-sm text-green-700">
              The one-time service fee of ${serviceFee.toFixed(2)} has been paid for {groupName}.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className={`border-2 rounded-lg p-4 ${
          isOverdue
            ? 'bg-red-50 border-red-300'
            : daysRemaining <= 3
            ? 'bg-yellow-50 border-yellow-300'
            : 'bg-blue-50 border-blue-300'
        }`}
      >
        <div className="flex items-start">
          {isOverdue ? (
            <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
          ) : (
            <Clock className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <h4 className={`font-semibold mb-1 ${isOverdue ? 'text-red-900' : 'text-blue-900'}`}>
              Service Fee Payment Required
            </h4>
            <p className={`text-sm mb-3 ${isOverdue ? 'text-red-700' : 'text-blue-700'}`}>
              {groupName} requires a one-time service fee of <strong>${serviceFee.toFixed(2)}</strong>.
              {deadline && (
                <>
                  {isOverdue ? (
                    <span className="block mt-1 font-semibold text-red-800">
                      Payment overdue since {new Date(deadline).toLocaleDateString()}
                    </span>
                  ) : (
                    <span className="block mt-1">
                      Payment due by {new Date(deadline).toLocaleDateString()} ({daysRemaining} days remaining)
                    </span>
                  )}
                </>
              )}
            </p>
            <button
              onClick={() => setShowPaymentModal(true)}
              className={`inline-flex items-center px-4 py-2 font-medium rounded-lg transition-colors ${
                isOverdue
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Pay Service Fee
            </button>
          </div>
        </div>
      </div>

      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900">Pay Service Fee</h2>
              <p className="text-slate-600 mt-1">{groupName}</p>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-700 font-medium">Service Fee Amount:</span>
                  <span className="text-2xl font-bold text-slate-900">${serviceFee.toFixed(2)}</span>
                </div>
                {deadline && (
                  <p className="text-sm text-slate-600">
                    Due by: {new Date(deadline).toLocaleDateString()}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Select Payment Method:
                </label>
                <div className="space-y-2">
                  <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors border-blue-500 bg-blue-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="paypal"
                      checked={paymentMethod === 'paypal'}
                      onChange={(e) => setPaymentMethod(e.target.value as 'paypal')}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div className="ml-3 flex-1">
                      <div className="font-semibold text-slate-900">PayPal</div>
                      <div className="text-sm text-slate-600">Pay instantly with PayPal</div>
                    </div>
                  </label>
                  <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors border-slate-200">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="interac"
                      checked={paymentMethod === 'interac'}
                      onChange={(e) => setPaymentMethod(e.target.value as 'interac')}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div className="ml-3 flex-1">
                      <div className="font-semibold text-slate-900">Interac e-Transfer</div>
                      <div className="text-sm text-slate-600">Send via Interac</div>
                    </div>
                  </label>
                  <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors border-slate-200">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cash"
                      checked={paymentMethod === 'cash'}
                      onChange={(e) => setPaymentMethod(e.target.value as 'cash')}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div className="ml-3 flex-1">
                      <div className="font-semibold text-slate-900">Cash</div>
                      <div className="text-sm text-slate-600">Pay in person</div>
                    </div>
                  </label>
                </div>
              </div>

              {paymentMethod === 'paypal' && (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                  <h3 className="font-bold text-blue-900 mb-2">PayPal Payment Instructions</h3>
                  <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                    <li>Click the button below to open PayPal</li>
                    <li>Send ${serviceFee.toFixed(2)} to our PayPal account</li>
                    <li>Return here and click "Confirm Payment" below</li>
                  </ol>
                  <a
                    href="https://paypal.me/MpingiPro"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Pay with PayPal
                  </a>
                </div>
              )}

              {paymentMethod === 'interac' && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <h3 className="font-bold text-slate-900 mb-2">Interac Instructions</h3>
                  <p className="text-sm text-slate-600">
                    Please contact the administrator for Interac e-Transfer details. Once payment is sent, click "Confirm Payment" below.
                  </p>
                </div>
              )}

              {paymentMethod === 'cash' && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <h3 className="font-bold text-slate-900 mb-2">Cash Payment</h3>
                  <p className="text-sm text-slate-600">
                    Please arrange to pay the service fee in person. Once payment is completed, click "Confirm Payment" below.
                  </p>
                </div>
              )}

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> After making the payment, click "Confirm Payment" to update your group status.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  disabled={confirming}
                  className="flex-1 py-3 px-4 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPayment}
                  disabled={confirming}
                  className="flex-1 py-3 px-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {confirming ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Confirm Payment
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
