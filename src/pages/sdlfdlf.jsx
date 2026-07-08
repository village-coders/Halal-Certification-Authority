import React from 'react'

import './css/Home.css'
import LoginCard from '../components/LoginCard'
import { Link } from 'react-router-dom'
import logo from '../assets/hcaLogo.png'

const Home = () => {
  return (
    <div className="app-container">

      <main className="main-section">
        <div className="welcome">
          <img src={logo} alt="HDI Logo" />
          <h1>Welcome to HDI Portal.</h1>
          <p>
            Register, apply, submit, track the progress of application and
            download your certificate through the HDI Portal.
          </p>
          <Link to='/signup' className='create-account' >Create Account</Link>
        </div>
        <LoginCard />
      </main>
    </div>
  )
}

export default Home