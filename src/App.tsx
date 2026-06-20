import DSETable from "./components/DSETable";
import { SocketDataProvider } from "./context/SocketDataContext";

function App() {
  return (
  <SocketDataProvider>
    <DSETable />
  </SocketDataProvider>);
}

export default App;
