import { useState } from 'react'
import { Sheet } from './Overlay'
import { api, ApiError } from '../lib/api'
import type { Product, Project, ProjectInput } from '../lib/types'

/** Edição dos dados cadastrais do projeto. Os valores vêm do plano de parcelas
 *  e por isso não são editáveis aqui. */
export function ProjetoForm({
  project,
  desktop,
  onClose,
  onUpdated,
  onToast,
}: {
  project: Project
  desktop: boolean
  onClose: () => void
  onUpdated: (p: Project) => void
  onToast: (title: string, body: string, tone?: string) => void
}) {
  const [draft, setDraft] = useState<ProjectInput>({
    name: project.name,
    description: project.description,
    po: project.po,
    product: project.product,
    running: project.running,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const set = <K extends keyof ProjectInput>(k: K, v: ProjectInput[K]) => {
    setDraft((d) => ({ ...d, [k]: v }))
    setErrors((e) => {
      const { [k]: _drop, ...rest } = e
      return rest
    })
  }

  const save = async () => {
    setErrors({})
    setSaving(true)
    try {
      const updated = await api.projects.update(project.id, {
        ...draft,
        name: draft.name.trim(),
        description: draft.description.trim(),
        po: draft.po.trim(),
      })
      onUpdated(updated)
      onToast('Projeto atualizado', updated.name)
      onClose()
    } catch (e) {
      if (e instanceof ApiError && e.issues.length) {
        setErrors(Object.fromEntries(e.issues.map((i) => [i.path, i.message])))
      } else {
        onToast(
          'Não deu para salvar',
          e instanceof Error ? e.message : String(e),
          'var(--destructive)',
        )
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet
      open
      onClose={onClose}
      desktop={desktop}
      title="Editar projeto"
      subtitle="Nome, descrição, P.O., produto e situação."
      footer={
        <>
          <button
            className="btn-ghost"
            onClick={onClose}
            disabled={saving}
            style={{ flex: 1, height: 42, fontSize: 13.5 }}
          >
            Cancelar
          </button>
          <button
            className="btn-primary"
            onClick={() => void save()}
            disabled={saving}
            style={{ flex: 1, height: 42, fontSize: 13.5 }}
          >
            {saving ? 'Salvando…' : 'Salvar alterações'}
          </button>
        </>
      }
    >
      <div>
        <label className="label" htmlFor="pj-name">
          Nome
        </label>
        <input
          id="pj-name"
          className={`field ${errors.name ? 'invalid' : ''}`}
          value={draft.name}
          onChange={(e) => set('name', e.target.value)}
        />
        {errors.name && <span className="error-text">{errors.name}</span>}
      </div>

      <div>
        <label className="label" htmlFor="pj-desc">
          Descrição
        </label>
        <textarea
          id="pj-desc"
          className={`field ${errors.description ? 'invalid' : ''}`}
          rows={4}
          value={draft.description}
          onChange={(e) => set('description', e.target.value)}
        />
        {errors.description && <span className="error-text">{errors.description}</span>}
      </div>

      <div>
        <label className="label" htmlFor="pj-po">
          P.O. (gerente)
        </label>
        <input
          id="pj-po"
          className={`field ${errors.po ? 'invalid' : ''}`}
          value={draft.po}
          onChange={(e) => set('po', e.target.value)}
        />
        {errors.po && <span className="error-text">{errors.po}</span>}
      </div>

      <div>
        <label className="label" htmlFor="pj-product">
          Produto
        </label>
        <select
          id="pj-product"
          className="field"
          value={draft.product}
          onChange={(e) => set('product', e.target.value as Product)}
          style={{ cursor: 'pointer' }}
        >
          <option value="LOOP">LOOP</option>
          <option value="START">START</option>
        </select>
      </div>

      <div>
        <span className="label">Situação</span>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { v: true, label: 'Em execução' },
            { v: false, label: 'Finalizado' },
          ].map((o) => {
            const on = draft.running === o.v
            return (
              <button
                key={String(o.v)}
                aria-pressed={on}
                onClick={() => set('running', o.v)}
                style={{
                  flex: 1,
                  height: 40,
                  border: `1px solid ${on ? 'color-mix(in oklch,var(--primary) 40%,transparent)' : 'var(--border)'}`,
                  borderRadius: 10,
                  background: on ? 'color-mix(in oklch,var(--primary) 12%,transparent)' : 'transparent',
                  color: on ? 'var(--primary)' : 'var(--mutedfg)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {o.label}
              </button>
            )
          })}
        </div>
      </div>

      <p style={{ margin: 0, fontSize: 12.5, color: 'var(--mutedfg)', lineHeight: 1.5 }}>
        Valor pago e NFs são editados no plano de parcelas — abra “Ver parcelas”.
      </p>
    </Sheet>
  )
}
