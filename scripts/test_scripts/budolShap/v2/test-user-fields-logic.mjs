import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function testUserFieldsLogic() {
    console.log('--- Testing User Phone and Address Logic ---')
    console.log('Prisma keys:', Object.keys(prisma).filter(k => !k.startsWith('_')))
    
    const testEmail = 'test_admin_fields_' + Date.now() + '@example.com'
    const testPhone = '09123456789'
    const userId = 'test_user_' + Date.now()

    try {
        // 1. Create user with phone and address
        console.log('1. Creating user with phone and address...')
        const userData = {
            id: userId,
            name: 'Test Admin Fields',
            email: testEmail,
            phoneNumber: testPhone,
            password: 'hashed_password_here',
            image: '',
            cart: {},
            accountType: 'BUYER',
            role: 'USER',
            emailVerified: false,
            Address: {
                create: {
                    name: 'Test Admin Fields',
                    email: testEmail,
                    phone: testPhone,
                    street: 'Test Street',
                    barangay: 'Test Barangay',
                    city: 'Test City',
                    state: 'Test State',
                    zip: '1234',
                    country: 'Philippines'
                }
            }
        }

        const createdUser = await prisma.user.create({
            data: userData,
            include: { Address: true }
        })

        console.log('✅ User created successfully')
        console.log('User ID:', createdUser.id)
        console.log('Phone:', createdUser.phoneNumber)
        console.log('Address Count:', createdUser.Address.length)
        
        if (createdUser.phoneNumber !== testPhone) throw new Error('Phone mismatch')
        if (createdUser.Address.length !== 1) throw new Error('Address count mismatch')
        if (createdUser.Address[0].street !== 'Test Street') throw new Error('Street mismatch')

        // 2. Update user phone and address
        console.log('\n2. Updating user phone and address...')
        const newPhone = '09987654321'
        const updateData = {
            phoneNumber: newPhone,
            Address: {
                update: {
                    where: { id: createdUser.Address[0].id },
                    data: {
                        street: 'Updated Street',
                        phone: newPhone
                    }
                }
            }
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            include: { Address: true }
        })

        console.log('✅ User updated successfully')
        console.log('New Phone:', updatedUser.phoneNumber)
        console.log('Updated Street:', updatedUser.Address[0].street)
        console.log('Updated Address Phone:', updatedUser.Address[0].phone)

        if (updatedUser.phoneNumber !== newPhone) throw new Error('Phone update mismatch')
        if (updatedUser.Address[0].street !== 'Updated Street') throw new Error('Street update mismatch')
        if (updatedUser.Address[0].phone !== newPhone) throw new Error('Address phone update mismatch')

        // 3. Cleanup
        console.log('\n3. Cleaning up test data...')
        await prisma.user.delete({ where: { id: userId } })
        console.log('✅ Test data cleaned up')
        
        console.log('\n--- ALL TESTS PASSED ---')

    } catch (error) {
        console.error('❌ Test failed:', error)
        // Cleanup on failure if userId was created
        try {
            await prisma.user.delete({ where: { id: userId } }).catch(() => {})
        } catch (e) {}
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

testUserFieldsLogic()
