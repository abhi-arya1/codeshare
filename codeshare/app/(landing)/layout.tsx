import Navbar from "@/components/navbar";

const MainLayout = ({ children }: any) => {
    return ( 
        <div className="dark:bg-[#1a1a1a] flex flex-col h-screen items-center justify-center max-h-screen w-screen">
            {children}
            <footer className="text-xs items-center justify-center text-muted-foreground pb-6">
                Made at UC Irvine 
                {/* by <a href="https://linkedin.com/in/abhiaarya" target="_blank" rel="noreferrer" className="dark:text-white text-black hover:text-muted-foreground underline">
                    Abhi Arya
                </a> */}
            </footer>   
        </div>
     );
}
 
export default MainLayout;