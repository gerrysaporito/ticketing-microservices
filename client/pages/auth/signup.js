import { useState } from 'react';
import Router from 'next/router';
import useRequest from '../../hooks/use-request';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { doRequest, errors } = useRequest({
    url: '/api/users/signup',
    method: 'post',
    body: {
      email, password
    },
    onSuccess: () => Router.push('/')
  })
  const onSubmit = async (event) => {
    event.preventDefault();
    await doRequest();
    

  }

  return (
    <form onSubmit={onSubmit}>
      <h1>Sign Up</h1>
      <div className='form-group'>
        <label>Email:</label>
        <input className='form-control' type='text' onChange={e => setEmail(e.target.value)} />
      </div>
      <div className='form-group'>
        <label>password:</label>
        <input className='form-control' type='password' onChange={e => setPassword(e.target.value)} />
      </div> 

      {errors}
      <button className='btn btn-primary'>Sign Up</button>
    </form>
  )
};

export default Signup;
