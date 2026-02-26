import { motion } from 'framer-motion';

export default function StickyFooter({ onNext, onPrev, isFirstStep, isLastStep, onSaveDraft, isSaving }) {
  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0   p-4 flex justify-between items-center z-50 md:pl-72"
    >
      <div className="flex gap-4">
        {!isFirstStep && (
          <button
            type="button"
            onClick={onPrev}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-lg bg-slate-200 border border-slate-200 text-slate-700 hover:bg-slate-50 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Back
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onSaveDraft}
          disabled={isSaving}
          className="px-6 py-2.5 rounded-lg bg-slate-200 border border-slate-100 text-slate-700 hover:bg-slate-300 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving...' : 'Save as Draft'}
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={isSaving}
          className="px-8 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition font-bold shadow-md shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLastStep ? (isSaving ? 'Publishing...' : 'Publish Product') : 'Next Step'}
        </button>
      </div>
    </motion.div>
  );
}
