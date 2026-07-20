import React from 'react'
import { useSelector } from 'react-redux'

const DisplayUsername = () => {
    const user = useSelector((state) => state.auth.user);

    return (
    <>
        <div className='username'>
            Welcome {user?.firstName}!
        </div>
    </>
  )
}

export default DisplayUsername