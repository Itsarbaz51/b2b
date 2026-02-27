function Loader() {
  return (
    <div className="absolute w-full h-screen flex justify-center items-center bg-black/10 backdrop-blur-sm z-50">
      <div colSpan="7" className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4 mx-auto"></div>
        <p className="">Loading...</p>
      </div>
    </div>
  );
}

export default Loader;
