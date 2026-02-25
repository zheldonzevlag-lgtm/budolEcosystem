'use client'
import Loading from "@/components/Loading"
import { CircleDollarSignIcon, LucidePhilippinePeso, ShoppingBasketIcon, StarIcon, TagsIcon, Package as PackageIcon } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useAuth } from "@/context/AuthContext"
import toast from "react-hot-toast"
import { useStoreDashboard } from "@/hooks/useStoreDashboard"
import { formatManilaTime } from "@/lib/dateUtils"

export default function Dashboard() {

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$'

    const router = useRouter()
    const { user, isLoading: authLoading } = useAuth()
    const [storeId, setStoreId] = useState(null)

    // Fetch store info first
    useEffect(() => {
        const fetchStore = async () => {
            if (authLoading || !user) return
            try {
                const res = await fetch(`/api/stores/user/${user.id}`)
                if (res.ok) {
                    const store = await res.json()
                    if (store) setStoreId(store.id)
                }
            } catch (err) {
                console.error("Dashboard: Failed to load store", err)
            }
        }
        fetchStore()
    }, [user, authLoading])

    const { 
        dashboardData, 
        isLoading: dashboardLoading 
    } = useStoreDashboard(storeId)

    const dashboardCardsData = [
        { title: 'Total Products', value: dashboardData.totalProducts, icon: ShoppingBasketIcon },
        { title: 'Potential Earnings', value: currency + dashboardData.potentialEarnings.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), icon: LucidePhilippinePeso, hint: 'Total from all orders (including unpaid)' },
        { title: 'In Escrow', value: currency + dashboardData.pendingEarnings.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), icon: LucidePhilippinePeso, hint: `Funds held in escrow (released ${dashboardData.protectionWindowDays} days after delivery)`, color: 'orange' },
        { title: 'Available Balance', value: currency + dashboardData.totalEarnings.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), icon: LucidePhilippinePeso, hint: 'Ready for withdrawal', color: 'green' },
        { title: 'Total Orders', value: dashboardData.totalOrders, icon: TagsIcon },
        { title: 'Total Sold Products', value: dashboardData.totalSoldProducts, icon: PackageIcon },
        { title: 'Total Ratings', value: dashboardData.ratings.length, icon: StarIcon },
    ]

    if (authLoading || dashboardLoading) return <Loading />

    return (
        <div className=" text-slate-500 mb-28">
            <h1 className="text-2xl">Seller <span className="text-slate-800 font-medium">Dashboard</span></h1>

            <div className="flex flex-wrap gap-5 my-10 mt-4">
                {
                    dashboardCardsData.map((card, index) => (
                        <div key={index} className="flex items-center gap-11 border border-slate-200 p-3 px-6 rounded-lg relative group">
                            <div className="flex flex-col gap-3 text-xs">
                                <p>{card.title}</p>
                                <b className="text-2xl font-medium text-slate-700">{card.value}</b>
                            </div>
                            <card.icon size={50} className={`w-11 h-11 p-2.5 rounded-full ${card.title === 'Total Ratings' && card.value > 0
                                ? 'text-yellow-500 bg-yellow-100'
                                : card.color === 'green'
                                    ? 'text-green-600 bg-green-100'
                                    : card.color === 'orange'
                                        ? 'text-orange-600 bg-orange-100'
                                        : 'text-slate-400 bg-slate-100'
                                }`} />
                            {card.hint && (
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                    {card.hint}
                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-800"></div>
                                </div>
                            )}
                        </div>
                    ))
                }
            </div>

            <h2>Buyer Reviews</h2>

            <div className="mt-5">
                {
                    dashboardData.ratings.map((review, index) => (
                        <div key={index} className="flex max-sm:flex-col gap-5 sm:items-center justify-between py-6 border-b border-slate-200 text-sm text-slate-600 max-w-4xl">
                            <div>
                                <div className="flex gap-3">
                                    <Image src={review.user.image} alt="" className="w-10 aspect-square rounded-full" width={100} height={100} />
                                    <div>
                                        <p className="font-medium">{review.user.name}</p>
                                        <p className="font-light text-slate-500">{formatManilaTime(review.createdAt, { dateStyle: 'medium' })}</p>
                                    </div>
                                </div>
                                <p className="mt-3 text-slate-500 max-w-xs leading-6">{review.review}</p>
                            </div>
                            <div className="flex flex-col justify-between gap-6 sm:items-end">
                                <div className="flex flex-col sm:items-end">
                                    <p className="text-slate-400">{review.product?.category}</p>
                                    <p className="font-medium">{review.product?.name}</p>
                                    <div className='flex items-center'>
                                        {Array(5).fill('').map((_, index) => (
                                            <StarIcon key={index} size={17} className='text-transparent mt-0.5' fill={review.rating >= index + 1 ? "#00C950" : "#D1D5DB"} />
                                        ))}
                                    </div>
                                </div>
                                <button onClick={() => router.push(`/product/${review.product.id}`)} className="bg-slate-100 px-5 py-2 hover:bg-slate-200 rounded transition-all">View Product</button>
                            </div>
                        </div>
                    ))
                }
            </div>
        </div>
    )
}