import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import type { Demanda } from '../types';
import { updateDemanda } from '../services/demandas-service';

interface ModalEditarDemandaProps {
  demanda: Demanda | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function ModalEditarDemanda({ demanda, onClose, onSuccess }: ModalEditarDemandaProps) {
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [status, setStatus] = useState<any>('aberta');
  const [prioridade, setPrioridade] = useState<any>('media');
  const [prazo, setPrazo] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (demanda) {
      setTitulo(demanda.titulo || '');
      setDescricao(demanda.descricao || '');
      setStatus(demanda.status || 'aberta');
      setPrioridade(demanda.prioridade || 'media');
      setPrazo(demanda.prazo ? demanda.prazo.split('T')[0] : '');
    }
  }, [demanda]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!demanda) return;

    try {
      setSalvando(true);
      await updateDemanda(demanda.id, {
        titulo,
        descricao,
        status,
        prioridade,
        prazo: prazo ? new Date(prazo).toISOString() : null,
      });
      onSuccess();
    } catch (err) {
      console.error('Erro ao atualizar demanda:', err);
      alert('Erro ao salvar as alterações.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Dialog.Root open={!!demanda} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80" />
        
        {/* Forçado fundo branco (bg-white) e texto escuro (text-gray-900) */}
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-white text-gray-900 p-6 shadow-2xl rounded-xl">
          
          <div className="flex flex-col space-y-1.5 text-center sm:text-left">
            <Dialog.Title className="text-xl font-bold tracking-tight text-gray-900">
              Editar Demanda
            </Dialog.Title>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-700">Título</label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                required
                className="mt-1 flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Título da demanda"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700">Descrição</label>
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="mt-1 flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Descrição detalhada..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-700">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="mt-1 flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="aberta">Aberta</option>
                  <option value="em_andamento">Em andamento</option>
                  <option value="concluida">Concluída</option>
                  <option value="cancelada">Cancelada</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700">Prioridade</label>
                <select
                  value={prioridade}
                  onChange={(e) => setPrioridade(e.target.value)}
                  className="mt-1 flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="baixa">Baixa</option>
                  <option value="media">Média</option>
                  <option value="alta">Alta</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700">Prazo</label>
              <input
                type="date"
                value={prazo}
                onChange={(e) => setPrazo(e.target.value)}
                className="mt-1 flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={salvando}
                className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {salvando ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </form>

          <Dialog.Close asChild>
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 rounded-sm p-1 text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5" />
              <span className="absolute w-[1px] h-[1px] overflow-hidden whitespace-nowrap border-0 p-0">
                Fechar
              </span>
            </button>
          </Dialog.Close>

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default ModalEditarDemanda;