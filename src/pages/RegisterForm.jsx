import axios from "axios";
import "./css/RegisterForm.css";
import { useState, useEffect } from "react";
import { FaBuilding, FaUser, FaLock } from "react-icons/fa";
import { toast } from "sonner";

function RegisterForm() {
  const countries = [
    "Afghanistan","Albania","Algeria","Andorra","Angola","Argentina","Armenia","Australia","Austria","Azerbaijan",
    "Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bhutan","Bolivia","Bosnia and Herzegovina",
    "Botswana","Brazil","Brunei","Bulgaria","Burkina Faso","Burundi","Cambodia","Cameroon","Canada","Cape Verde","Central African Republic",
    "Chad","Chile","China","Colombia","Comoros","Congo (Democratic Republic)","Congo (Republic)","Costa Rica","Croatia","Cuba","Cyprus",
    "Czech Republic","Denmark","Djibouti","Dominica","Dominican Republic","Ecuador","Egypt","El Salvador","Equatorial Guinea","Eritrea",
    "Estonia","Eswatini","Ethiopia","Fiji","Finland","France","Gabon","Gambia","Georgia","Germany","Ghana","Greece","Grenada",
    "Guatemala","Guinea","Guinea-Bissau","Guyana","Haiti","Honduras","Hungary","Iceland","India","Indonesia","Iran","Iraq","Ireland",
    "Israel","Italy","Jamaica","Japan","Jordan","Kazakhstan","Kenya","Kiribati","Kuwait","Kyrgyzstan","Laos","Latvia","Lebanon","Lesotho",
    "Liberia","Libya","Liechtenstein","Lithuania","Luxembourg","Madagascar","Malawi","Malaysia","Maldives","Mali","Malta","Marshall Islands",
    "Mauritania","Mauritius","Mexico","Micronesia","Moldova","Monaco","Mongolia","Montenegro","Morocco","Mozambique","Myanmar","Namibia",
    "Nauru","Nepal","Netherlands","New Zealand","Nicaragua","Niger","Nigeria","North Korea","North Macedonia","Norway","Oman","Pakistan",
    "Palau","Palestine","Panama","Papua New Guinea","Paraguay","Peru","Philippines","Poland","Portugal","Qatar","Romania","Russia","Rwanda",
    "Saint Kitts and Nevis","Saint Lucia","Saint Vincent and the Grenadines","Samoa","San Marino","Sao Tome and Principe","Saudi Arabia","Senegal",
    "Serbia","Seychelles","Sierra Leone","Singapore","Slovakia","Slovenia","Solomon Islands","Somalia","South Africa","South Korea","South Sudan",
    "Spain","Sri Lanka","Sudan","Suriname","Sweden","Switzerland","Syria","Taiwan","Tajikistan","Tanzania","Thailand","Togo","Tonga",
    "Trinidad and Tobago","Tunisia","Turkey","Turkmenistan","Tuvalu","Uganda","Ukraine","United Arab Emirates","United Kingdom","United States",
    "Uruguay","Uzbekistan","Vanuatu","Vatican City","Venezuela","Vietnam","Yemen","Zambia","Zimbabwe",
  ];

  const [formData, setFormData] = useState({
    companyName: "",
    companyContact: "",
    fullName: "",
    country: "",
    contact: "",
    email: "",
    password: "",
    confirmPassword: "",
    registrationNo: "",
    address: "",
    lga: "",
    city: "",
    state: "",
    website: "",
  });

  const [errorMessage, setErrorMessage] = useState({});
  const [loading, setLoading] = useState(false);

  const baseUrl = import.meta.env.VITE_BASE_URL;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Generate registration number once
  useEffect(() => {
    const randomNumber = Math.floor(Math.random() * 1000000000);
    const regNo = `HCA-${randomNumber}`;
    setFormData((prev) => ({ ...prev, registrationNo: regNo }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = {};

    if (!formData.companyName) errors.companyName = "Company name is required";
    if (!formData.companyContact) errors.companyContact = "Company contact is required";
    if (!formData.fullName) errors.fullName = "Full name is required";
    if (!formData.country) errors.country = "Country is required";
    if (!formData.contact) errors.contact = "Contact is required";
    if (!formData.email) errors.email = "Email is required";
    if (!formData.password) errors.password = "Password is required";
    if (!formData.confirmPassword) errors.confirmPassword = "Confirm password is required";
    if (!formData.address) errors.address = "Address is required";
    if (!formData.lga) errors.lga = "Local Government Area is required";
    if (!formData.city) errors.city = "City is required";
    if (!formData.state) errors.state = "State is required";

    setErrorMessage(errors);

    if (Object.keys(errors).length > 0) return;

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`${baseUrl}/auth/signup`, formData);

      if (response.data.status === "success") {
        toast.success(response.data.message);
        setFormData({
          companyName: "",
          companyContact: "",
          fullName: "",
          country: "",
          contact: "",
          email: "",
          password: "",
          confirmPassword: "",
          registrationNo: "",
          address: "",
          lga: "",
          city: "",
          state: "",
          website: "",
        });
        setErrorMessage({});
      }
    } catch (error) {
      console.error("Error registering:", error);
      toast.error(error.response?.data?.message || "Error registering");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="modern-form" onSubmit={handleSubmit}>
      <div className="register-heading">
        <h2>Register your Company</h2>
        <p>To enjoy our service</p>
      </div>

      {/* Company Info */}
      <div className="form-section">
        <h3><FaBuilding /> Company Information</h3>
        <div className="form-group">
          <div>
            <label>Company Name *</label>
            <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} />
            <p style={{ color: "red" }}>{errorMessage.companyName}</p>
          </div>
          <div>
            <label>Contact *</label>
            <input type="text" name="companyContact" value={formData.companyContact} onChange={handleChange} />
            <p style={{ color: "red" }}>{errorMessage.companyContact}</p>
          </div>
        </div>
        <div className="form-group">
          <div>
            <label>Registration No. *</label>
            <input type="text" name="registrationNo" value={formData.registrationNo} disabled />
          </div>
          <div>
            <label>Address *</label>
            <input type="text" name="address" value={formData.address} onChange={handleChange} />
            <p style={{ color: "red" }}>{errorMessage.address}</p>
          </div>
        </div>
        <div className="form-group">
          <div>
            <label>Local Govt. Area *</label>
            <input type="text" name="lga" value={formData.lga} onChange={handleChange} />
            <p style={{ color: "red" }}>{errorMessage.lga}</p>
          </div>
          <div>
            <label>City *</label>
            <input type="text" name="city" value={formData.city} onChange={handleChange} />
            <p style={{ color: "red" }}>{errorMessage.city}</p>
          </div>
        </div>
        <div className="form-group">
          <div>
            <label>State *</label>
            <input type="text" name="state" value={formData.state} onChange={handleChange} />
            <p style={{ color: "red" }}>{errorMessage.state}</p>
          </div>
          <div>
            <label>Website (Optional)</label>
            <input type="url" name="website" value={formData.website} onChange={handleChange} />
          </div>
        </div>
      </div>

      {/* Contact Person */}
      <div className="form-section">
        <h3><FaUser /> Contact Person</h3>
        <div className="form-group">
          <div>
            <label>Full Name *</label>
            <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} />
            <p style={{ color: "red" }}>{errorMessage.fullName}</p>
          </div>
          <div>
            <label>Country *</label>
            <select name="country" value={formData.country} onChange={handleChange}>
              <option value="">-- Select Country --</option>
              {countries.sort().map((c, idx) => (
                <option key={idx} value={c}>{c}</option>
              ))}
            </select>
            <p style={{ color: "red" }}>{errorMessage.country}</p>
          </div>
          <div>
            <label>Contact Number *</label>
            <input type="text" name="contact" value={formData.contact} onChange={handleChange} />
            <p style={{ color: "red" }}>{errorMessage.contact}</p>
          </div>
        </div>
      </div>

      {/* Login Info */}
      <div className="form-section">
        <h3><FaLock /> Login Information</h3>
        <div className="form-group">
          <div>
            <label>Login Email Address *</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} />
            <p style={{ color: "red" }}>{errorMessage.email}</p>
          </div>
          <div>
            <label>Password *</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} />
            <p style={{ color: "red" }}>{errorMessage.password}</p>
          </div>
          <div>
            <label>Confirm Password *</label>
            <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} />
            <p style={{ color: "red" }}>{errorMessage.confirmPassword}</p>
          </div>
        </div>
      </div>

      <button type="submit" className="modern-btn" disabled={loading}>
        {loading ? "Submitting..." : "Register"}
      </button>
    </form>
  );
}

export default RegisterForm;
