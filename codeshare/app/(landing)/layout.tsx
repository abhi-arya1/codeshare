import Navbar from "@/components/navbar";

const MainLayout = ({ children }: any) => {
    return ( 
        <div className="flex flex-col h-screen w-full items-center justify-center max-h-screen w-screen">
            {children}
        </div>
     );
}
 
export default MainLayout;