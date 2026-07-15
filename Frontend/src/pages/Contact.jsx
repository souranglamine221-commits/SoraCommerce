// Frontend/src/pages/Contact.jsx
import React, { useState } from 'react';
import { Mail, Phone, MessageCircle, Send } from 'lucide-react';

const Contact = () => {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatus('sending');
    setTimeout(() => {
      setStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 1500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900">Contactez-nous</h1>
        <p className="mt-2 text-gray-600">Une question ? Notre équipe est là pour vous aider.</p>
      </div>

      {/* Cartes d'information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
          <Mail className="h-8 w-8 text-blue-600 mx-auto mb-4" />
          <h3 className="font-bold text-lg mb-2">Email</h3>
          <a href="mailto:souranglamine221@gmail.com" className="text-gray-600 hover:text-blue-600">souranglamine221@gmail.com</a>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
          <Phone className="h-8 w-8 text-blue-600 mx-auto mb-4" />
          <h3 className="font-bold text-lg mb-2">Téléphone</h3>
          <a href="tel:+221773521208" className="text-gray-600 hover:text-blue-600">+221 77 352 12 08</a>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
          <MessageCircle className="h-8 w-8 text-green-600 mx-auto mb-4" />
          <h3 className="font-bold text-lg mb-2">WhatsApp</h3>
          <a href="https://wa.me/221773521208" target="_blank" rel="noreferrer" className="text-green-600 hover:text-green-700 font-medium">
            Nous contacter sur WhatsApp
          </a>
        </div>
      </div>

      {/* Formulaire */}
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-md border border-gray-100">
        <h2 className="text-2xl font-bold mb-6">Envoyez-nous un message</h2>
        
        {status === 'success' ? (
          <div className="bg-green-50 text-green-700 p-4 rounded-lg text-center">
            Merci pour votre message. Nous vous répondrons dans les plus brefs délais.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
              <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sujet</label>
              <input required type="text" name="subject" value={formData.subject} onChange={handleChange} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea required name="message" rows="4" value={formData.message} onChange={handleChange} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"></textarea>
            </div>
            <button type="submit" disabled={status === 'sending'} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors flex justify-center items-center">
              {status === 'sending' ? 'Envoi en cours...' : <>Envoyer le message <Send className="ml-2 h-4 w-4" /></>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Contact;