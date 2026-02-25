import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function testProfileAddressPersistence() {
    console.log('--- Testing My Profile Address Persistence (v1.9.0) ---')
    
    const testEmail = 'profile_test_' + Date.now() + '@example.com'
    const testId = 'profile_user_' + Date.now()
    const initialPhone = '09111111111'
    const updatedPhone = '09222222222'

    try {
        // 1. Create a baseline user without address
        console.log('1. Creating baseline user...')
        await prisma.user.create({
            data: {
                id: testId,
                name: 'Profile Tester',
                email: testEmail,
                phoneNumber: initialPhone,
                password: 'test_password',
                image: '',
                cart: {},
                accountType: 'BUYER'
            }
        })
        console.log('✅ Baseline user created')

        // 2. Simulate API call to PUT /api/users with address (Creation)
        console.log('2. Simulating profile update with NEW address...')
        const addressData = {
            city: 'Quezon City',
            barangay: 'San Bartolome',
            detailedAddress: '123 Novaliches St',
            latitude: 14.7011,
            longitude: 121.0400,
            zip: '1116',
            state: 'Metro Manila',
            notes: 'Near the gate',
            isDefault: true
        }

        // Logic from /api/users/route.js
        const existingAddress = await prisma.address.findFirst({
            where: { userId: testId }
        })

        if (existingAddress) {
            throw new Error('Address should not exist yet')
        }

        await prisma.user.update({
            where: { id: testId },
            data: {
                name: 'Profile Tester Updated',
                phoneNumber: updatedPhone,
                Address: {
                    create: {
                        city: addressData.city,
                        barangay: addressData.barangay,
                        street: addressData.detailedAddress,
                        latitude: addressData.latitude,
                        longitude: addressData.longitude,
                        zip: addressData.zip,
                        state: addressData.state,
                        notes: addressData.notes,
                        name: 'Profile Tester Updated',
                        email: testEmail,
                        phone: updatedPhone,
                        country: 'Philippines'
                    }
                }
            }
        })

        // Verify creation
        const userWithAddress = await prisma.user.findUnique({
            where: { id: testId },
            include: { Address: true }
        })

        console.log('✅ Profile and Address created successfully')
        if (userWithAddress.Address.length !== 1) throw new Error('Address count mismatch after creation')
        if (userWithAddress.Address[0].city !== 'Quezon City') throw new Error('City mismatch')
        if (userWithAddress.phoneNumber !== updatedPhone) throw new Error('User phone mismatch')

        // 3. Simulate API call to PUT /api/users with updated address (Update)
        console.log('3. Simulating profile update with EXISTING address...')
        const updatedAddressData = {
            city: 'Makati City',
            barangay: 'Bel-Air',
            detailedAddress: '456 Ayala Ave',
            latitude: 14.5547,
            longitude: 121.0244,
            zip: '1209',
            state: 'Metro Manila',
            notes: 'Penthouse',
            isDefault: true
        }

        const currentAddress = await prisma.address.findFirst({
            where: { userId: testId }
        })

        await prisma.user.update({
            where: { id: testId },
            data: {
                Address: {
                    update: {
                        where: { id: currentAddress.id },
                        data: {
                            city: updatedAddressData.city,
                            barangay: updatedAddressData.barangay,
                            street: updatedAddressData.detailedAddress,
                            latitude: updatedAddressData.latitude,
                            longitude: updatedAddressData.longitude,
                            zip: updatedAddressData.zip,
                            state: updatedAddressData.state,
                            notes: updatedAddressData.notes,
                            phone: updatedPhone
                        }
                    }
                }
            }
        })

        // Verify update
        const userUpdatedAddress = await prisma.user.findUnique({
            where: { id: testId },
            include: { Address: true }
        })

        console.log('✅ Profile and Address updated successfully')
        if (userUpdatedAddress.Address.length !== 1) throw new Error('Address count mismatch after update')
        if (userUpdatedAddress.Address[0].city !== 'Makati City') throw new Error('City mismatch after update')
        if (userUpdatedAddress.Address[0].street !== '456 Ayala Ave') throw new Error('Street mismatch after update')

        // 4. Cleanup
        console.log('4. Cleaning up...')
        await prisma.user.delete({ where: { id: testId } })
        console.log('✅ Cleanup complete')

        console.log('\n--- ALL PROFILE PERSISTENCE TESTS PASSED ---')

    } catch (error) {
        console.error('❌ Test failed:', error)
        await prisma.user.delete({ where: { id: testId } }).catch(() => {})
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

testProfileAddressPersistence()
