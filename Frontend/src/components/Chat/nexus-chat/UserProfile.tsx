export default function UserProfile() {
  return (
    <div className="mt-auto border-t border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/85 backdrop-blur-sm p-4 sticky bottom-0">
      <div className="flex items-center justify-between group">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              alt="User avatar"
              className="w-11.5 h-11.5 rounded-full object-cover shadow-sm border-2 border-white dark:border-slate-700 bg-indigo-100 dark:bg-slate-700"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBhdohSQixQb0_g2QHWuSjJA9BVRoSYDXNtAVblJFt41U_XFe3qsht6jW2kgRG2Nj_mGvdoMLNOMjeDqtkAJmuCMOgnHgZk3Z8EZFvjpNtEE_dzqj5fbaIIhatNNyIo27VhGofWsWIJtskkiYRPBEFwP1vyTGsrSnCgE2v1ssbEyCnhBayfj0NdRWL8aV_CQpNad5AXaKw7FnpPOBQFuor-1HOLiNU0lDip4uImly68rzLJNX-IvnOUzXetIwUTNSFpNOG0d1yYsmXM"
            />
            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-[2.5px] border-white bg-green-500"></div>
          </div>
          <div className="flex flex-col justify-center">
            <span className="font-bold text-slate-800 dark:text-slate-100 text-[15px] leading-tight">
              Alex Johnson
            </span>
            <span className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              Online
            </span>
          </div>
        </div>
        <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300">
          <span className="material-symbols-outlined text-[20px]">
            settings
          </span>
        </button>
      </div>
    </div>
  );
}
