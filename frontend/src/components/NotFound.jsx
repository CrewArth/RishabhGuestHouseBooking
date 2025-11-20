import { useNavigate } from "react-router-dom";
import "../styles/notFound.css";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="notfound-wrapper">
      <div className="notfound-card">
      <strong><h1>404</h1></strong>
        <h2>Page Not Found</h2>
        <p>
          The page you’re looking for doesn’t exist or has been moved. Please
          check the URL or return to the previous page.
        </p>
        <button className="notfound-btn" onClick={() => navigate(-1)}>
          Go Back
        </button>
      </div>
    </div>
  );
};

export default NotFound;

