import { Navigate, Outlet } from "react-router-dom";

interface NotAuthRoutesProps {
  isAuth: boolean;
}

const NotAuthRoutes: React.FC<NotAuthRoutesProps> = ({ isAuth }) => {
  return isAuth ? <Navigate to="/" /> : <Outlet />;
};

export default NotAuthRoutes;
