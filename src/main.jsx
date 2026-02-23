
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux';
import App from './App.jsx';
import store from './store/store';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './global.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <Provider store={ store }>
    <App />
  </Provider>
)
