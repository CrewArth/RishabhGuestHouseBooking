import React from 'react'

const DisplayUsername = () => {
    const username = JSON.parse(localStorage.getItem('user'));

    return (
    <>
        <div className='username'>
            Welcome {username.firstName}!
        </div>
    </>
  )
}

export default DisplayUsername      