import Navbar from "@/components/navbar";

const MainLayout = ({ children }: any) => {
    return ( 
        <div className="flex flex-col max-h-screen w-screen">
            <Navbar />
            {children}
        </div>
     );
}
 
export default MainLayout;