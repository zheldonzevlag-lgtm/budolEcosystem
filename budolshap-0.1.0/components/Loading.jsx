'use client'

const Loading = () => {

    return (
        <div className='fixed inset-0 flex items-center justify-center bg-white/30 z-50'>
            <div className='w-11 h-11 rounded-full border-3 border-gray-300 border-t-green-500 animate-spin'></div>
        </div>
    )
}

export default Loading