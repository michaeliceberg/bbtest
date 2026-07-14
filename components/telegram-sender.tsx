// "use client";
// import { useState } from 'react';
// import axios from 'axios';
// import { toast } from 'react-toastify'; // Optional for notifications

// function ContactForm() {
//   const [userInput, setUserInput] = useState({
//     name: '',
//     email: '',
//     message: ''
//   });

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setUserInput({ ...userInput, [name]: value });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     try {
//       const response = await axios.post('/api/contact', userInput);

//       if (response.status === 200) {
//         toast.success('Message sent successfully!');
//         setUserInput({ name: '', email: '', message: '' });
//       } else {
//         toast.error('Failed to send message.');
//       }
//     } catch (error) {
//       toast.error('Error sending message.');
//     }
//   };

//   return (
//     <form onSubmit={handleSubmit}>
//       <div>
//         <label>Your Name:</label>
//         <input
//           type="text"
//           name="name"
//           value={userInput.name}
//           onChange={handleChange}
//           required
//         />
//       </div>
//       <div>
//         <label>Your Email:</label>
//         <input
//           type="email"
//           name="email"
//           value={userInput.email}
//           onChange={handleChange}
//           required
//         />
//       </div>
//       <div>
//         <label>Your Message:</label>
//         <textarea
//           name="message"
//           value={userInput.message}
//           onChange={handleChange}
//           required
//         />
//       </div>
//       <button type="submit">Send Message</button>
//     </form>
//   );
// }

// export default ContactForm;