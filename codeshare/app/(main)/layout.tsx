import Navbar from "@/components/navbar";

const MainLayout = ({ children }: any) => {
    return ( 
        <div className="flex flex-col h-screen w-screen dark:bg-[#1f1f1f]">
            <Navbar />
            {children}
        </div>
     );
}
 
export default MainLayout;