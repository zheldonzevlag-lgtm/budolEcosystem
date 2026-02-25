The standard practice in e-commerce for a success return lifecycle is to use "Refunded" or "Refund Completed" as the terminal business state, because the ultimate goal of a Return+Refund request is the financial settlement. However, I agree that focusing only on the money can be confusing when the primary concern is the physical item.

Terminology Alignment
I have updated the terminal status label to "Returned & Refunded". This is the industry "Gold Standard" (used by marketplaces like Zalora and Farfetch) because:

"Returned" confirms the logistics loop is closed (you got your item back).
"Refunded" confirms the financial loop is closed (escrow released).
Correcting the "Auto-Refund" Flow
Regarding your point about the status being "Refunded" while the delivery is still "On Going" — this identified a logic gap in the automation. Standard practice (Shopee/Lazada style) dictates that the seller should have a window to inspect the item before the refund is triggered.

I have updated the system with the following behavior:

Stop Immediate Auto-Refund: When Lalamove confirms the delivery back to you, the system will now stop at "Arrived at Store" (Status: DELIVERED).
Manual Verification: You will now see the blue "RECEIVE" button when an item is at your store. Clicking this will move the status to "Returned & Refunded".
Safety Net (Cron): To protect buyers, if you don't click "Receive" within 2 days, the system will then auto-process the refund (this is the Shopee guarantee period).
Sync Consistency: The Delivery Column will now accurately stay as "Delivered" once the rider completes the trip, matching the business status.

New Status Journey:
Phase	                      Seller UI Status	    Delivery Column
Pickup	                      Picked Up	            Picked Up
In Transit	                  In Transit	        In Transit
Arrival	                      Arrived at Store	    Delivered (Seller action needed)
Final	                      Returned & Refunded	Delivered (Complete)

This ensures you are never surprised by a "Refunded" status before you've had a chance to see the returned parcel.