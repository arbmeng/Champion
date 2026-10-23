import { useState } from 'react'
import { Droplets, Plus, Trash2, Utensils } from 'lucide-react'
import { useApp } from '../state/store'
import { nutritionDay } from '../state/selectors'
import { foods, MEALS } from '../data/social'
import { Button, Card, IconButton, Input, PageHeader, ProgressBar, ProgressRing, Section, SectionTabs, Select } from '../ui/primitives'
import { BarsChart } from '../ui/charts'
import { ChartCard } from '../ui/domain'
import { Sheet, useToast } from '../ui/overlays'
import { profileTabs } from '../ui/sections'
import { fmtNum, pct } from '../lib/format'
import { tr } from '../lib/i18n'

function Macro({ label, value, target, unit = 'g' }) {
  return (
    <div className="stack-sm macro">
      <div className="row between"><span className="label">{label}</span><span className="caption num">{Math.round(value)} / {target}{unit}</span></div>
      <ProgressBar value={pct(value, target)} label={tr("{0} progress", label)} tone={value > target * 1.1 ? 'warning' : 'accent'} />
    </div>
  )
}

export function Nutrition() {
  const { state, actions } = useApp()
  const toast = useToast()
  const day = nutritionDay(state)
  const t = state.nutrition.targets
  const [meal, setMeal] = useState(null)
  const [food, setFood] = useState(foods[0].id)
  const [qty, setQty] = useState('1')
  const [custom, setCustom] = useState({ name: '', kcal: '', p: '' })
  const [useCustom, setUseCustom] = useState(false)
  const past = [...state.nutrition.past, { date: tr('Today'), kcal: Math.round(day.kcal) }].map((d) => ({ label: d.date.length > 5 ? d.date.slice(5).replace('-', '/') : d.date, kcal: d.kcal }))

  const add = (e) => {
    e.preventDefault()
    const q = parseFloat(qty) || 1
    if (useCustom) {
      const kcal = parseFloat(custom.kcal)
      if (!custom.name.trim() || !(kcal > 0)) { toast({ title: tr("Add a name and calories"), tone: 'warning' }); return }
      const p = parseFloat(custom.p) || 0
      actions.addCustomFood({ name: custom.name.trim(), kcal, p, c: Math.max(0, Math.round((kcal - p * 4) * 0.5 / 4)), f: Math.max(0, Math.round((kcal - p * 4) * 0.5 / 9)) }, meal, q)
      setCustom({ name: '', kcal: '', p: '' })
    } else actions.addFood(food, meal, q)
    toast({ title: tr("Food logged"), body: meal, tone: 'success' })
    setMeal(null); setQty('1'); setUseCustom(false)
  }

  return (
    <div className="stack-lg">
      <PageHeader eyebrow={tr("Fuel")} title={tr("Nutrition")} subtitle={tr("A light daily log that supports training. Targets are editable defaults, not prescriptions.")} />
      <SectionTabs items={profileTabs} />
      <div className="grid-2 wide-left">
        <Card className="stack">
          <div className="row gap-6 wrap">
            <ProgressRing value={pct(day.kcal, t.kcal)} size={132} stroke={11} label={tr("{0} percent of calorie target", Math.round(pct(day.kcal, t.kcal)))}><div><div className="num num-lg">{fmtNum(day.kcal)}</div><div className="caption">{tr("of")} {fmtNum(t.kcal)} {tr("kcal")}</div></div></ProgressRing>
            <div className="grow stack"><Macro label={tr("Protein")} value={day.p} target={t.p} /><Macro label={tr("Carbs")} value={day.c} target={t.c} /><Macro label={tr("Fat")} value={day.f} target={t.f} /></div>
          </div>
        </Card>
        <Card className="stack">
          <div className="row between"><h3 className="row gap-2"><Droplets size={18} className="accent" aria-hidden="true" /> {tr("Water")}</h3><span className="num">{(day.water / 1000).toFixed(2)} <span className="caption">/ {t.water / 1000} L</span></span></div>
          <ProgressBar value={pct(day.water, t.water)} tone="info" label={tr("Water progress")} height={12} />
          <div className="row gap-2 wrap"><Button onClick={() => actions.addWater(250)}>{tr("+250 ml")}</Button><Button onClick={() => actions.addWater(500)}>{tr("+500 ml")}</Button><Button variant="ghost" onClick={() => actions.addWater(-250)}>{tr("Undo")}</Button></div>
        </Card>
      </div>

      <Section title={tr("Meals")}>
        <div className="grid-2">
          {MEALS.map((m) => {
            const items = day.meals[m]
            const kcal = items.reduce((n, i) => n + i.kcal * i.qty, 0)
            return (
              <Card key={m} className="stack-sm meal">
                <div className="row between"><h3 className="cap">{tr(m)}</h3><span className="num caption">{fmtNum(kcal)} {tr("kcal")}</span></div>
                {items.length ? <ul>{items.map((i) => <li key={i.id} className="row between meal-item"><span className="grow">{i.name}{i.qty !== 1 && <span className="caption"> ×{i.qty}</span>}</span><span className="num caption">{Math.round(i.kcal * i.qty)}</span><IconButton size="sm" label={tr("Remove {0}", i.name)} icon={Trash2} onClick={() => actions.removeFood(m, i.id)} /></li>)}</ul> : <p className="caption">{tr("Nothing logged yet.")}</p>}
                <Button size="sm" icon={Plus} onClick={() => setMeal(m)}>{tr("Add food")}</Button>
              </Card>
            )
          })}
        </div>
      </Section>

      <ChartCard title={tr("Calories, last 7 days")} question={tr("Am I fuelling consistently?")} foot={tr("Daily target {0} kcal", fmtNum(t.kcal))}><BarsChart data={past} x="label" y="kcal" unit={tr("kcal")} height={200} /></ChartCard>

      <Sheet open={Boolean(meal)} onClose={() => setMeal(null)} title={meal ? tr('Add to {0}', tr(meal)) : ''}>
        <form className="stack" onSubmit={add}>
          {useCustom ? (
            <>
              <Input label={tr("Food name")} value={custom.name} onChange={(e) => setCustom({ ...custom, name: e.target.value })} data-autofocus />
              <div className="grid-2"><Input label={tr("Calories")} inputMode="numeric" value={custom.kcal} onChange={(e) => setCustom({ ...custom, kcal: e.target.value })} /><Input label={tr("Protein (g)")} inputMode="numeric" value={custom.p} onChange={(e) => setCustom({ ...custom, p: e.target.value })} /></div>
            </>
          ) : <Select label={tr("Food")} value={food} onChange={setFood} options={foods.map((f) => ({ value: f.id, label: tr("{0} — {1} kcal", f.name, f.kcal) }))} />}
          <Input label={tr("Servings")} inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)} />
          <button type="button" className="link" onClick={() => setUseCustom(!useCustom)}>{useCustom ? tr("Pick from list instead") : tr("Enter a custom food")}</button>
          <Button type="submit" variant="primary" size="lg" block icon={Utensils}>{tr("Log food")}</Button>
        </form>
      </Sheet>
    </div>
  )
}
