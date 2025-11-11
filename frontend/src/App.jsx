import React from 'react'
import AppRouter from './routes/app.route'
import useStore from './store/useStore'
import { ToastContainer } from 'react-toastify'

const App = () => {
  const {step}=useStore()
  console.log(step);
  
  return (
    <>
  <ToastContainer />
  <AppRouter />
    </>
  )
}

export default App