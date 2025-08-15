import './App.css'
import WorkflowEditor from './components/WorkflowEditor'

function App() {
  return (
    <div className="App">
      <header className="app-header">
        <h1>Workflow Editor</h1>
      </header>
      <main className="app-main">
        <WorkflowEditor />
      </main>
    </div>
  )
}

export default App