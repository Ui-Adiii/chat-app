import React from 'react'
import { Navigate,Outlet } from 'react-router-dom'

const PrivateRoute = ({isAuthenticated,redirectTo="/login"}) => {
    return isAuthenticated ? <Outlet /> :<Navigate to={redirectTo} />
}


const PublicRoute = ({isAuthenticated,redirectTo="/"}) => {
    return !isAuthenticated ? <Outlet /> : <Navigate to={redirectTo} />
}

export  {PrivateRoute,PublicRoute}