import { Routes, Route } from 'react-router-dom'
import MeetingNoteList from '@/modules/vault/MeetingNotes/MeetingNoteList'
import DecisionList from '@/modules/vault/Decisions/DecisionList'
import RetroList from '@/modules/vault/Retros/RetroList'
import RunSheetList from '@/modules/vault/RunSheets/RunSheetList'
import WikiPage from '@/modules/vault/Wiki/WikiPage'
import CostList from '@/modules/vault/Costs/CostList'

export default function Vault() {
  return (
    <div className="h-full overflow-auto">
      <Routes>
        <Route path="notes" element={<MeetingNoteList />} />
        <Route path="decisions" element={<DecisionList />} />
        <Route path="retros" element={<RetroList />} />
        <Route path="runsheets" element={<RunSheetList />} />
        <Route path="wiki" element={<WikiPage />} />
        <Route path="costs" element={<CostList />} />
        <Route index element={<MeetingNoteList />} />
      </Routes>
    </div>
  )
}
