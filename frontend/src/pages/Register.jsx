import { useState, useContext } from 'react';

import { AuthContext } from '../context/AuthContext';

import { useNavigate, Link } from 'react-router-dom';



const Register = () => {

  const [username, setUsername] = useState('');

  const [email, setEmail] = useState('');

  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useContext(AuthContext);

  const navigate = useNavigate();



  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await register(username, email, password);

    if (result.success) {
      setSuccessMsg("Create account successfully");
      navigate('/onboarding');
    } else {
      if (result.message && result.message.toLowerCase().includes('already exist')) {
        setError("Already have account based on email");
      } else {
        setError(result.message || "Registration failed");
      }
      setLoading(false);
    }
  };



  return (

    <div

      className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative bg-cover bg-center bg-no-repeat"

      style={{ backgroundImage: "url('https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=2070&auto=format&fit=crop')" }}

    >

      <div className="absolute inset-0 bg-black/60"></div>

      <div className="max-w-md w-full space-y-8 bg-black/60 backdrop-blur-xl p-10 rounded-xl shadow-2xl border border-white/10 relative z-10">

        <div>

          <h2 className="mt-2 text-center text-3xl font-extrabold text-white">Create an account</h2>

          <p className="mt-2 text-center text-sm text-gray-400">

            Already have an account?{' '}

            <Link to="/login" className="font-medium text-primary hover:text-red-400">

              Sign in

            </Link>

          </p>

        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>

          {error && <div className="bg-red-500/10 border border-red-500/50 text-red-500 rounded p-3 text-sm text-center">{error}</div>}
          {successMsg && <div className="bg-green-600/20 border border-green-500 text-green-400 rounded p-3 text-sm text-center font-medium">{successMsg}</div>}

          <div className="rounded-md shadow-sm space-y-3">

            <div>

              <input

                type="text"

                required

                className="appearance-none relative block w-full px-3 py-3 border border-gray-700 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm transition"

                placeholder="Username"

                value={username}

                onChange={(e) => setUsername(e.target.value)}

              />

            </div>

            <div>

              <input

                type="email"

                required

                className="appearance-none relative block w-full px-3 py-3 border border-gray-700 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm transition"

                placeholder="Email address"

                value={email}

                onChange={(e) => setEmail(e.target.value)}

              />

            </div>

            <div>

              <input

                type="password"

                required

                className="appearance-none relative block w-full px-3 py-3 border border-gray-700 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm transition"

                placeholder="Password"

                value={password}

                onChange={(e) => setPassword(e.target.value)}

              />

            </div>

          </div>



          <div>

            <button

              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white ${loading ? 'bg-gray-600 cursor-not-allowed' : 'bg-primary hover:bg-red-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-gray-900 transition shadow-lg`}

            >

              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing up...
                </span>
              ) : 'Sign up'}

            </button>

          </div>

        </form>

      </div>

    </div>

  );

};



export default Register;