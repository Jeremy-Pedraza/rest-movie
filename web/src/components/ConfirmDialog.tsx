import Modal from './Modal';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
}

export default function ConfirmDialog({ open, onClose, onConfirm, title, message }: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title || 'Confirmar'}>
      <p className="text-gray-600 mb-6">{message || '¿Estás seguro?'}</p>
      <div className="flex justify-end gap-3">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm rounded-lg border hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700"
        >
          Eliminar
        </button>
      </div>
    </Modal>
  );
}
