import Navbar from "@/components/navbar";

const MainLayout = ({ children }: any) => {
    return ( 
        <div className="dark:bg-[#1a1a1a] flex flex-col h-screen w-full items-center justify-center max-h-screen w-screen">
            {children}
            <footer className="text-xs items-center justify-center text-muted-foreground pb-6">
                Made with ❤️ at UC Irvine
            </footer>   
        </div>
     );
}
 
export default MainLayout;