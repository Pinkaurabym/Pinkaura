const FormField = ({ 
  label, 
  name, 
  type = 'text', 
  value, 
  onChange, 
  error, 
  placeholder, 
  required = false, 
  rows 
}) => (
  <div>
    <label className="block text-sm font-semibold text-dark-700 mb-2">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {rows ? (
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        rows={rows}
        className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 ${
          error ? 'border-red-500' : 'border-dark-200'
        }`}
        placeholder={placeholder}
      />
    ) : (
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 ${
          error ? 'border-red-500' : 'border-dark-200'
        }`}
        placeholder={placeholder}
      />
    )}
    {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
  </div>
);

export default FormField;
