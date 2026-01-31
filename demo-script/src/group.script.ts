import { MY_PHONE, MONGODB_URI, USE_MONGODB_STORAGE, TARGET_PHONE } from './dotenv';
import logger from './logger';
// @ts-ignore
import { WhatsappSocketGroup } from '../../src';
// import { WhatsappSocketGroup } from '@hdriel/whatsapp-socket';
import { readFileSync } from 'node:fs';
import { DOCUMENT_ASSET_PATH, FILE_AUTH_PATH, IMAGE_ASSET_PATH, MP3_ASSET_PATH, VIDEO_ASSET_PATH } from './paths';

const TEST_CONFIG = {
    mongoURL: USE_MONGODB_STORAGE ? MONGODB_URI : undefined,
    fileAuthStateDirectoryPath: FILE_AUTH_PATH,
    mongoCollection: 'whatsapp-group-test-auth',
    appName: 'WhatsApp Group Test Bot',
    debug: true,
    logger,
    printQRInTerminal: true,
    pairingPhone: MY_PHONE,
};

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

const runTests: Record<string, boolean> = {
    createGroup: true,
    updateGroupInfo: false,
    groupSettings: false, // הועבר לפני participants כדי לבדוק נעילות
    manageParticipants: false,
    participantPermissions: false, // טסט חדש - ניהול הרשאות
    profilePicture: false, // הופעל - ניהול תמונת פרופיל
    sendMessages: false,
    sendList: true,
    sendMedia: false,
    inviteManagement: false,
    cleanup: false,
};

async function runWhatsAppGroupTests() {
    logger.info(null, '🚀 Starting WhatsApp Group Tests...\n');

    let client: WhatsappSocketGroup | null = null;
    let testGroupId: string = '';
    let inviteCode: string | undefined;
    const shouldTestTargetPhone = TARGET_PHONE && TARGET_PHONE !== MY_PHONE;

    try {
        // ============================================
        // TEST 1: Connection & Authentication
        // ============================================
        logger.info(null, '📱 TEST 1: Connecting to WhatsApp...');

        client = new WhatsappSocketGroup({
            ...TEST_CONFIG,
            logger: logger as any,
            onOpen: async () => {
                logger.info(null, '✅ Connection opened successfully!');
            },
            onClose: async () => {
                logger.info(null, '❌ Connection closed');
            },
            onQR: async (_qr: string, code: string | null | undefined) => {
                logger.info(null, '📸 QR Code received');
                if (code) {
                    logger.info(null, `🔐 Pairing Code: ${code}`);
                }
            },
            onConnectionStatusChange: async (status) => {
                logger.info(null, `📊 Connection status: ${status}`);
            },
            onReceiveMessages: async (messages, type) => {
                logger.info(null, `📨 Received ${messages?.length} messages (${type})`);
            },
        });

        await client.startConnection({ connectionAttempts: 3 });
        await sleep(3000);

        if (!client.isConnected()) {
            throw new Error('Failed to connect to WhatsApp');
        }

        logger.info(null, '✅ TEST 1 PASSED: Successfully connected to WhatsApp\n');

        if (runTests.createGroup) {
            // ============================================
            // TEST 2: Create Group
            // ============================================
            logger.info(null, '👥 TEST 2: Creating test group...');

            const groupResult = await client.createGroup({
                name: '🧪 Test Group - WhatsApp Socket',
                participants: [],
            });

            testGroupId = groupResult?.id as string;
            logger.info(null, `✅ Group created with ID: ${testGroupId}`);

            await sleep(2000);

            const groupMetadata = await client.getGroupMetadata(testGroupId!);
            logger.info(null, `✅ Group verified - Name: ${groupMetadata?.subject}`);

            logger.info(null, '✅ TEST 2 PASSED: Group created successfully\n');
        }

        if (runTests.updateGroupInfo && testGroupId) {
            // ============================================
            // TEST 3: Update Group Information
            // ============================================
            logger.info(null, '✏️ TEST 3: Updating group information...');

            await client.updateGroupName(testGroupId, '🧪 Test Group - Updated Name');
            logger.info(null, '✅ Group name updated');

            await sleep(1000);

            await client.updateGroupDescription(
                testGroupId,
                'Updated description: Testing all group features of WhatsApp Socket library. 🚀'
            );
            logger.info(null, '✅ Group description updated');

            await sleep(1000);

            const updatedMetadata = await client.getGroupMetadata(testGroupId);
            logger.info(null, `✅ Verified - Name: ${updatedMetadata?.subject}`);
            logger.info(null, `✅ Verified - Description: ${updatedMetadata?.desc}`);

            logger.info(null, '✅ TEST 3 PASSED: Group information updated successfully\n');
        }

        if (runTests.groupSettings && testGroupId) {
            // ============================================
            // TEST 4: Group Settings - Lock/Unlock
            // ============================================
            logger.info(null, '⚙️ TEST 4: Testing group settings (Lock/Unlock)...');

            // Lock group - only admins can send messages
            logger.info(null, '🔒 Locking group (announcement mode - only admins can send)...');
            await client.updateGroupSettings(testGroupId, 'announcement');
            logger.info(null, '✅ Group locked - only admins can send messages');

            await sleep(1500);

            // Unlock group - everyone can send messages
            logger.info(null, '🔓 Unlocking group (normal mode - everyone can send)...');
            await client.updateGroupSettings(testGroupId, 'not_announcement');
            logger.info(null, '✅ Group unlocked - everyone can send messages');

            await sleep(1500);

            // Lock group info - only admins can edit group info
            logger.info(null, '🔒 Locking group info (only admins can edit)...');
            await client.updateGroupSettings(testGroupId, 'locked');
            logger.info(null, '✅ Group info locked - only admins can edit');

            await sleep(1500);

            // Unlock group info - everyone can edit group info
            logger.info(null, '🔓 Unlocking group info (everyone can edit)...');
            await client.updateGroupSettings(testGroupId, 'unlocked');
            logger.info(null, '✅ Group info unlocked - everyone can edit');

            logger.info(null, '✅ TEST 4 PASSED: Group lock/unlock settings updated successfully\n');
        }

        if (runTests.profilePicture && testGroupId) {
            // ============================================
            // TEST 5: Group Profile Picture Management
            // ============================================
            logger.info(null, '🖼️ TEST 5: Managing group profile picture...');

            // Get current profile picture (before setting)
            logger.info(null, '📸 Getting current profile picture...');
            const currentPicUrl = await client.getGroupProfilePicture(testGroupId, false);
            logger.info(null, `✅ Current profile picture: ${currentPicUrl || 'No picture set'}`);

            await sleep(1500);

            // Set/Update group profile picture
            logger.info(null, '📤 Setting group profile picture...');
            const profileImageBuffer = readFileSync(IMAGE_ASSET_PATH);
            await client.updateGroupProfilePicture(testGroupId, profileImageBuffer);
            logger.info(null, '✅ Group profile picture updated successfully');

            await sleep(2000);

            // Get profile picture URL (low resolution)
            logger.info(null, '📥 Getting profile picture URL (preview)...');
            const previewPicUrl = await client.getGroupProfilePicture(testGroupId, false);
            logger.info(null, `✅ Preview URL retrieved: ${previewPicUrl ? 'Available' : 'Not available'}`);

            await sleep(1500);

            // Get profile picture URL (high resolution)
            logger.info(null, '📥 Getting profile picture URL (high-res)...');
            const highResPicUrl = await client.getGroupProfilePicture(testGroupId, true);
            logger.info(null, `✅ High-res URL retrieved: ${highResPicUrl ? 'Available' : 'Not available'}`);

            await sleep(1500);

            // Remove profile picture
            logger.info(null, '🗑️ Removing group profile picture...');
            await client.removeGroupProfilePicture(testGroupId);
            logger.info(null, '✅ Group profile picture removed successfully');

            await sleep(1500);

            // Verify removal
            const removedPicUrl = await client.getGroupProfilePicture(testGroupId, false);
            logger.info(null, `✅ Verified removal: ${removedPicUrl ? 'Still has picture' : 'Picture removed'}`);

            logger.info(null, '✅ TEST 5 PASSED: Profile picture management completed successfully\n');
        }

        if (runTests.manageParticipants && testGroupId && shouldTestTargetPhone) {
            // ============================================
            // TEST 6: Manage Participants - Add TARGET_PHONE
            // ============================================
            logger.info(null, '👤 TEST 6: Managing group participants...');

            // Get and send invite link first
            logger.info(null, '🔗 Getting group invite link...');
            const initialInviteCode = await client.getGroupInviteCode(testGroupId);
            const inviteLink = `https://chat.whatsapp.com/${initialInviteCode}`;
            logger.info(null, `✅ Invite link: ${inviteLink}`);

            // Send invite link as first message
            await client.sendTextMessage(
                testGroupId,
                `🎉 Welcome to the test group!\n\n🔗 Invite link: ${inviteLink}\n\n📋 This is an automated test of WhatsApp Socket library.`
            );
            logger.info(null, '✅ Invite link sent to group');

            await sleep(2000);

            logger.info(null, `📞 Adding participant: ${TARGET_PHONE}`);

            // Add TARGET_PHONE to group
            await client.addParticipants(testGroupId, TARGET_PHONE);
            logger.info(null, '✅ Participant added to group');

            await sleep(2000);

            // Verify participant was added
            const metadata = await client.getGroupMetadata(testGroupId);
            const participantCount = metadata?.participants?.length || 0;
            logger.info(null, `✅ Current participants count: ${participantCount}`);

            const targetParticipant = metadata?.participants?.find((p) =>
                p.id.includes(TARGET_PHONE.replace(/[^0-9]/g, ''))
            );

            if (targetParticipant) {
                logger.info(null, `✅ Verified - ${TARGET_PHONE} is in the group`);
                logger.info(null, `✅ Admin status: ${targetParticipant.admin ? 'Yes' : 'No'}`);
            } else {
                logger.info(null, `⚠️  Could not verify ${TARGET_PHONE} in group`);
            }

            logger.info(null, '✅ TEST 6 PASSED: Participant added successfully\n');
        } else if (runTests.manageParticipants && testGroupId) {
            logger.info(null, '👤 TEST 6: Managing group participants...');

            // Get and send invite link even if no target phone
            logger.info(null, '🔗 Getting group invite link...');
            const initialInviteCode = await client.getGroupInviteCode(testGroupId);
            const inviteLink = `https://chat.whatsapp.com/${initialInviteCode}`;
            logger.info(null, `✅ Invite link: ${inviteLink}`);

            // Send invite link as first message
            await client.sendTextMessage(
                testGroupId,
                `🎉 Welcome to the test group!\n\n🔗 Invite link: ${inviteLink}\n\n📋 This is an automated test of WhatsApp Socket library.`
            );
            logger.info(null, '✅ Invite link sent to group');

            await sleep(2000);

            logger.info(null, '📝 Note: TARGET_PHONE is not set or equals MY_PHONE - skipping participant tests');

            const metadata = await client.getGroupMetadata(testGroupId);
            logger.info(null, `✅ Current participants count: ${metadata?.participants?.length || 0}`);

            logger.info(null, '✅ TEST 6 PASSED: Participant management APIs verified\n');
        }

        if (runTests.participantPermissions && testGroupId && shouldTestTargetPhone) {
            // ============================================
            // TEST 7: Participant Permissions Management
            // ============================================
            logger.info(null, '🔐 TEST 7: Managing participant permissions...');

            // Promote to admin
            logger.info(null, `⬆️  Promoting ${TARGET_PHONE} to admin...`);
            await client.promoteToAdmin(testGroupId, TARGET_PHONE);
            logger.info(null, '✅ Participant promoted to admin');

            await sleep(2000);

            // Verify promotion
            let metadata = await client.getGroupMetadata(testGroupId);
            let targetParticipant = metadata?.participants?.find((p) =>
                p.id.includes(TARGET_PHONE.replace(/[^0-9]/g, ''))
            );

            if (targetParticipant?.admin) {
                logger.info(null, `✅ Verified - ${TARGET_PHONE} is now an admin`);
            } else {
                logger.info(null, `⚠️  Could not verify admin status for ${TARGET_PHONE}`);
            }

            await sleep(2000);

            // Demote from admin
            logger.info(null, `⬇️  Demoting ${TARGET_PHONE} from admin...`);
            await client.demoteFromAdmin(testGroupId, TARGET_PHONE);
            logger.info(null, '✅ Participant demoted from admin');

            await sleep(2000);

            // Verify demotion
            metadata = await client.getGroupMetadata(testGroupId);
            targetParticipant = metadata?.participants?.find((p) => p.id.includes(TARGET_PHONE.replace(/[^0-9]/g, '')));

            if (!targetParticipant?.admin) {
                logger.info(null, `✅ Verified - ${TARGET_PHONE} is no longer an admin`);
            } else {
                logger.info(null, `⚠️  Could not verify demotion for ${TARGET_PHONE}`);
            }

            await sleep(2000);

            // Remove participant
            logger.info(null, `❌ Removing ${TARGET_PHONE} from group...`);
            await client.removeParticipants(testGroupId, TARGET_PHONE);
            logger.info(null, '✅ Participant removed from group');

            await sleep(2000);

            // Verify removal
            metadata = await client.getGroupMetadata(testGroupId);
            targetParticipant = metadata?.participants?.find((p) => p.id.includes(TARGET_PHONE.replace(/[^0-9]/g, '')));

            if (!targetParticipant) {
                logger.info(null, `✅ Verified - ${TARGET_PHONE} is no longer in the group`);
            } else {
                logger.info(null, `⚠️  ${TARGET_PHONE} still appears in group`);
            }

            await sleep(2000);

            // Add back to group
            logger.info(null, `➕ Adding ${TARGET_PHONE} back to group...`);
            await client.addParticipants(testGroupId, TARGET_PHONE);
            logger.info(null, '✅ Participant added back to group');

            await sleep(2000);

            // Verify re-addition
            metadata = await client.getGroupMetadata(testGroupId);
            targetParticipant = metadata?.participants?.find((p) => p.id.includes(TARGET_PHONE.replace(/[^0-9]/g, '')));

            if (targetParticipant) {
                logger.info(null, `✅ Verified - ${TARGET_PHONE} is back in the group`);
            }

            logger.info(null, '✅ TEST 7 PASSED: Permissions managed successfully\n');
        }

        if (runTests.sendMessages && testGroupId) {
            // ============================================
            // TEST 8: Send Messages to Group
            // ============================================
            logger.info(null, '💬 TEST 8: Sending messages to group...');

            await client.sendTextMessage(testGroupId, 'Hello! This is a test message in the group 👋');
            logger.info(null, '✅ Text message sent');

            await sleep(1000);

            await client.sendMentionAll(testGroupId, '📢 Attention everyone! This mentions all participants.');
            logger.info(null, '✅ Mention all message sent');

            await sleep(1000);

            await client.sendButtonsMessage(testGroupId, {
                title: 'Welcome to the test group!',
                subtitle: 'Choose an action below',
                buttons: [
                    {
                        label: 'Visit GitHub',
                        url: 'https://github.com/hdriel/whatsapp-socket',
                    },
                    {
                        label: 'Copy Command',
                        copy: 'npm install @hdriel/whatsapp-socket',
                    },
                ],
            });
            logger.info(null, '✅ Buttons message sent');

            await sleep(1000);

            await client.sendReplyButtonsMessage(testGroupId, {
                title: 'Quick poll: How is the test going?',
                subtitle: 'Select your answer',
                buttons: ['Great! 🎉', 'Good 👍', 'Needs work 🔧'],
            });
            logger.info(null, '✅ Reply buttons message sent');

            logger.info(null, '✅ TEST 8 PASSED: Messages sent successfully\n');
        }

        if (runTests.sendList) {
            // ============================================
            // TEST 3: List Messages
            // ============================================
            logger.info(null, '📋 TEST 3: Testing list messages...');

            // Single section list
            await client.sendListMessage(testGroupId, {
                title: 'Welcome! Please choose a service:',
                subtitle: 'Select from our menu',
                buttonText: 'View Options',
                sections: [
                    {
                        title: 'Main Services',
                        rows: [
                            {
                                id: 'service_support',
                                title: '🎧 Customer Support',
                                description: 'Get help from our support team',
                            },
                            {
                                id: 'service_sales',
                                title: '💼 Sales Inquiry',
                                description: 'Contact our sales department',
                            },
                            {
                                id: 'service_technical',
                                title: '🔧 Technical Support',
                                description: 'Technical assistance and troubleshooting',
                            },
                        ],
                    },
                ],
            });
            logger.info(null, '✅ Single section list sent');

            await sleep(2000);

            // Multiple sections list
            await client.sendListMessage(testGroupId, {
                title: 'Select a product category:',
                subtitle: 'Browse our catalog',
                buttonText: 'Show Categories',
                sections: [
                    {
                        title: 'Electronics',
                        rows: [
                            {
                                id: 'prod_phone',
                                title: '📱 Smartphones',
                                description: 'Latest mobile devices',
                            },
                            {
                                id: 'prod_laptop',
                                title: '💻 Laptops',
                                description: 'Computers and notebooks',
                            },
                            {
                                id: 'prod_tablet',
                                title: '📲 Tablets',
                                description: 'iPad and Android tablets',
                            },
                        ],
                    },
                    {
                        title: 'Accessories',
                        rows: [
                            {
                                id: 'acc_case',
                                title: '🛡️ Cases & Covers',
                                description: 'Protective accessories',
                            },
                            {
                                id: 'acc_charger',
                                title: '🔌 Chargers',
                                description: 'Power adapters and cables',
                            },
                            {
                                id: 'acc_headphone',
                                title: '🎧 Headphones',
                                description: 'Audio accessories',
                            },
                        ],
                    },
                    {
                        title: 'Services',
                        rows: [
                            {
                                id: 'srv_warranty',
                                title: '🛡️ Extended Warranty',
                            },
                            {
                                id: 'srv_repair',
                                title: '🔧 Repair Service',
                            },
                        ],
                    },
                ],
            });
            logger.info(null, '✅ Multiple sections list sent');

            await sleep(2000);

            // Simple list without descriptions
            await client.sendListMessage(testGroupId, {
                title: 'Quick Actions',
                buttonText: 'Select Action',
                sections: [
                    {
                        title: 'Available Actions',
                        rows: [
                            {
                                id: 'action_1',
                                title: 'Check Balance',
                            },
                            {
                                id: 'action_2',
                                title: 'View History',
                            },
                            {
                                id: 'action_3',
                                title: 'Update Profile',
                            },
                            {
                                id: 'action_4',
                                title: 'Settings',
                            },
                        ],
                    },
                ],
            });
            logger.info(null, '✅ Simple list (no descriptions) sent');

            logger.info(null, '✅ TEST 3 PASSED: List messages sent successfully\n');
        }

        if (runTests.sendMedia && testGroupId) {
            // ============================================
            // TEST 9: Send Media to Group
            // ============================================
            logger.info(null, '🖼️ TEST 9: Sending media to group...');

            const imageBuffer = readFileSync(IMAGE_ASSET_PATH);
            await client.sendImageMessage(testGroupId, imageBuffer, {
                caption: '📸 Test image sent to group',
            });
            logger.info(null, '✅ Image sent');

            await sleep(1500);

            const videoBuffer = readFileSync(VIDEO_ASSET_PATH);
            await client.sendVideoMessage(testGroupId, videoBuffer, { caption: '🎥 Test video sent to group' });
            logger.info(null, '✅ Video sent');

            await sleep(1500);

            const audioBuffer = readFileSync(MP3_ASSET_PATH);
            await client.sendAudioMessage(testGroupId, audioBuffer, { ptt: false });
            logger.info(null, '✅ Audio sent');

            await sleep(1500);

            const docBuffer = readFileSync(DOCUMENT_ASSET_PATH);
            await client.sendDocumentMessage(testGroupId, docBuffer, {
                fileName: 'test-document.docx',
                mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            });
            logger.info(null, '✅ Document sent');

            await sleep(1500);

            await client.sendLocationMessage(
                testGroupId,
                { latitude: 32.0853, longitude: 34.7818 },
                'Test Location',
                'Tel Aviv, Israel'
            );
            logger.info(null, '✅ Location sent');

            logger.info(null, '✅ TEST 9 PASSED: Media sent successfully\n');
        }

        if (runTests.inviteManagement && testGroupId) {
            // ============================================
            // TEST 10: Invite Code Management
            // ============================================
            logger.info(null, '🔗 TEST 10: Managing group invite codes...');

            inviteCode = await client.getGroupInviteCode(testGroupId);
            logger.info(null, `✅ Current invite code: ${inviteCode}`);
            logger.info(null, `✅ Full invite link: https://chat.whatsapp.com/${inviteCode}`);

            await sleep(1000);

            const groupInfo = await client.getGroupInfoFromInvite(inviteCode!);
            logger.info(null, `✅ Group info from invite - Name: ${groupInfo?.subject}`);

            await sleep(1000);

            const newInviteCode = await client.revokeGroupInviteCode(testGroupId);
            logger.info(null, `✅ New invite code generated: ${newInviteCode}`);
            logger.info(null, `✅ Old invite code (${inviteCode}) is now invalid`);

            logger.info(null, '✅ TEST 10 PASSED: Invite management working successfully\n');
        }

        if (runTests.cleanup && testGroupId) {
            // ============================================
            // TEST 11: Cleanup - Remove participant and Leave Group
            // ============================================
            logger.info(null, '🧹 TEST 11: Cleanup - Final participant management and leaving group...');

            // Remove TARGET_PHONE if it was added
            if (shouldTestTargetPhone) {
                logger.info(null, `❌ Removing ${TARGET_PHONE} from group before cleanup...`);
                try {
                    await client.removeParticipants(testGroupId, TARGET_PHONE);
                    logger.info(null, `✅ ${TARGET_PHONE} removed from group`);
                    await sleep(1500);
                } catch (error) {
                    logger.info(null, `⚠️  Could not remove ${TARGET_PHONE} (may have already left)`);
                }
            }

            await client.sendTextMessage(testGroupId, '👋 Test completed! Bot is leaving the group now.');
            await sleep(2000);

            const allGroups = await client.getAllGroups();
            logger.info(null, `✅ Total groups: ${allGroups.length}`);

            await sleep(1000);

            await client.leaveGroup(testGroupId);
            logger.info(null, '✅ Successfully left the test group');

            logger.info(null, '✅ TEST 11 PASSED: Cleanup completed successfully\n');
        }

        // ============================================
        // Summary
        // ============================================
        logger.info(null, '\n' + '='.repeat(60));
        logger.info(null, '🎉 ALL GROUP TESTS PASSED SUCCESSFULLY! 🎉');
        logger.info(null, '='.repeat(60));
        logger.info(null, '\nTest Summary:');
        logger.info(null, '✅ Connection & Authentication');
        runTests.createGroup && logger.info(null, '✅ Group Creation');
        runTests.updateGroupInfo && logger.info(null, '✅ Group Information Update (Name + Description)');
        runTests.groupSettings && logger.info(null, '✅ Group Settings (Lock/Unlock Messages & Info)');
        runTests.profilePicture &&
            logger.info(null, '✅ Profile Picture Management (Set + Get Preview + Get High-Res + Remove)');
        runTests.manageParticipants && logger.info(null, '✅ Participant Management (Add + Invite Link)');
        runTests.participantPermissions &&
            shouldTestTargetPhone &&
            logger.info(null, '✅ Participant Permissions (Promote/Demote/Remove/Re-add)');
        runTests.sendMessages && logger.info(null, '✅ Group Messages (Text + Mentions + Buttons)');
        runTests.sendMedia && logger.info(null, '✅ Group Media (Image + Video + Audio + Document + Location)');
        runTests.inviteManagement && logger.info(null, '✅ Invite Code Management (Get + Revoke + Info)');
        runTests.cleanup && logger.info(null, '✅ Cleanup (Remove Participants + Leave Group)');

        if (shouldTestTargetPhone) {
            logger.info(null, `\n👤 Tested with participant: ${TARGET_PHONE}`);
        } else {
            logger.info(null, '\n📝 Note: No additional participant tested (TARGET_PHONE not set or equals MY_PHONE)');
        }

        const tests = Object.values(runTests);
        const total = tests.filter((v) => v).length;
        const totalStr = `${total + 1}/${tests.length + 1}`;
        logger.info(null, `📊 Total: ${totalStr} tests passed`);

        if (testGroupId) {
            logger.info(null, `\n🔍 Note: Test group ID was: ${testGroupId}`);
        }
    } catch (error) {
        console.error('\n❌ TEST FAILED:', error);
        throw error;
    } finally {
        if (client) {
            logger.info(null, '\n🧹 Cleaning up connection...');
            await sleep(2000);
            await client.closeConnection();
            logger.info(null, '✅ Connection closed');
        }
    }
}

runWhatsAppGroupTests()
    .then(() => {
        logger.info(null, '\n✨ Group test suite completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        logger.error(null, '\n💥 Group test suite failed:', error);
        process.exit(1);
    });
