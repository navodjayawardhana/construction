const LoadingSpinner = () => {
    return (
        <div className="flex items-center justify-center min-h-[200px]">
            <div className="animate-spin border-4 border-construction border-l-transparent rounded-full w-10 h-10"></div>
        </div>
    );
};

export default LoadingSpinner;
