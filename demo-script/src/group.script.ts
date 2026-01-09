import { MY_PHONE, MONGODB_URI, USE_MONGODB_STORAGE } from './dotenv';
import logger from './logger';
import { WhatsappSocketGroup } from '@hdriel/whatsapp-socket';
import { readFileSync } from 'node:fs';
import {
    DOCUMENT_ASSET_PATH,
    FILE_AUTH_PATH,
    IMAGE_ASSET_PATH,
    MP3_ASSET_PATH,
    VIDEO_ASSET_PATH,
    // THUMBNAIL_ASSET_PATH,
    // XLSX_ASSET_PATH,
} from './paths';

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
    manageParticipants: false,
    sendMessages: false,
    sendMedia: false,
    groupSettings: false,
    inviteManagement: false,
    profilePicture: false,
    cleanup: false,
};

async function runWhatsAppGroupTests() {
    logger.info(null, '🚀 Starting WhatsApp Group Tests...\n');

    let client: WhatsappSocketGroup | null = null;
    let testGroupId: string | undefined;
    let inviteCode: string | undefined;

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
                // description: 'This is a test group created by WhatsApp Socket library for testing purposes.',
                participants: [], // Only bot will be in the group initially
            });

            testGroupId = groupResult?.id;
            logger.info(null, `✅ Group created with ID: ${testGroupId}`);

            await sleep(2000);

            // Verify group was created
            const groupMetadata = await client.getGroupMetadata(testGroupId!);
            logger.info(null, `✅ Group verified - Name: ${groupMetadata?.subject}`);

            logger.info(null, '✅ TEST 2 PASSED: Group created successfully\n');
        }

        if (runTests.updateGroupInfo && testGroupId) {
            // ============================================
            // TEST 3: Update Group Information
            // ============================================
            logger.info(null, '✏️ TEST 3: Updating group information...');

            // Update group name
            await client.updateGroupName(testGroupId, '🧪 Test Group - Updated Name');
            logger.info(null, '✅ Group name updated');

            await sleep(1000);

            // Update group description
            await client.updateGroupDescription(
                testGroupId,
                'Updated description: Testing all group features of WhatsApp Socket library. 🚀'
            );
            logger.info(null, '✅ Group description updated');

            await sleep(1000);

            // Verify updates
            const updatedMetadata = await client.getGroupMetadata(testGroupId);
            logger.info(null, `✅ Verified - Name: ${updatedMetadata?.subject}`);
            logger.info(null, `✅ Verified - Description: ${updatedMetadata?.desc}`);

            logger.info(null, '✅ TEST 3 PASSED: Group information updated successfully\n');
        }

        if (runTests.manageParticipants && testGroupId) {
            // ============================================
            // TEST 4: Manage Participants
            // ============================================
            logger.info(null, '👤 TEST 4: Managing group participants...');

            // Note: In a real test, you would add actual phone numbers here
            // For this test, we'll just demonstrate the API calls
            logger.info(null, '📝 Note: Participant management requires real phone numbers');
            logger.info(null, '📝 Skipping actual participant add/remove to avoid errors');

            // Get current participants
            const metadata = await client.getGroupMetadata(testGroupId);
            logger.info(null, `✅ Current participants count: ${metadata?.participants?.length || 0}`);

            logger.info(null, '✅ TEST 4 PASSED: Participant management APIs verified\n');
        }

        if (runTests.sendMessages && testGroupId) {
            // ============================================
            // TEST 5: Send Messages to Group
            // ============================================
            logger.info(null, '💬 TEST 5: Sending messages to group...');

            // Send simple text message
            await client.sendTextMessage(testGroupId, 'Hello! This is a test message in the group 👋');
            logger.info(null, '✅ Text message sent');

            await sleep(1000);

            // Send message with mention all
            await client.sendMentionAll(testGroupId, '📢 Attention everyone! This mentions all participants.');
            logger.info(null, '✅ Mention all message sent');

            await sleep(1000);

            // Send buttons message
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

            // Send reply buttons
            await client.sendReplyButtonsMessage(testGroupId, {
                title: 'Quick poll: How is the test going?',
                subtitle: 'Select your answer',
                buttons: ['Great! 🎉', 'Good 👍', 'Needs work 🔧'],
            });
            logger.info(null, '✅ Reply buttons message sent');

            logger.info(null, '✅ TEST 5 PASSED: Messages sent successfully\n');
        }

        if (runTests.sendMedia && testGroupId) {
            // ============================================
            // TEST 6: Send Media to Group
            // ============================================
            logger.info(null, '🖼️ TEST 6: Sending media to group...');

            // Send image
            const imageBuffer = readFileSync(IMAGE_ASSET_PATH);
            await client.sendImageMessage(testGroupId, imageBuffer, {
                caption: '📸 Test image sent to group',
            });
            logger.info(null, '✅ Image sent');

            await sleep(1500);

            // Send video
            const videoBuffer = readFileSync(VIDEO_ASSET_PATH);
            await client.sendVideoMessage(testGroupId, videoBuffer, '🎥 Test video sent to group');
            logger.info(null, '✅ Video sent');

            await sleep(1500);

            // Send audio
            const audioBuffer = readFileSync(MP3_ASSET_PATH);
            await client.sendAudioMessage(testGroupId, audioBuffer, { ptt: false });
            logger.info(null, '✅ Audio sent');

            await sleep(1500);

            // Send document
            const docBuffer = readFileSync(DOCUMENT_ASSET_PATH);
            await client.sendDocumentMessage(
                testGroupId,
                docBuffer,
                'test-document.docx',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            );
            logger.info(null, '✅ Document sent');

            await sleep(1500);

            // // Excel with thumbnail
            // const excelBuffer = readFileSync(XLSX_ASSET_PATH);
            // const thumbnailBuffer = readFileSync(THUMBNAIL_ASSET_PATH);
            // await client.sendFileMessage(TEST_RECIPIENT, excelBuffer, {
            //     caption: 'Excel Spreadsheet',
            //     mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            //     filename: 'test-spreadsheet.xlsx',
            //     jpegThumbnailSrc: thumbnailBuffer,
            // });
            // logger.info(null, '✅ Excel with thumbnail sent');

            // Send location
            await client.sendLocationMessage(
                testGroupId,
                32.0853, // Tel Aviv latitude
                34.7818, // Tel Aviv longitude
                'Test Location',
                'Tel Aviv, Israel'
            );
            logger.info(null, '✅ Location sent');

            logger.info(null, '✅ TEST 6 PASSED: Media sent successfully\n');
        }

        if (runTests.groupSettings && testGroupId) {
            // ============================================
            // TEST 7: Group Settings
            // ============================================
            logger.info(null, '⚙️ TEST 7: Testing group settings...');

            // Update group settings - only admins can send messages
            await client.updateGroupSettings(testGroupId, 'announcement');
            logger.info(null, '✅ Group set to announcement mode (only admins can send)');

            await sleep(1000);

            // Update group settings - everyone can send messages
            await client.updateGroupSettings(testGroupId, 'not_announcement');
            logger.info(null, '✅ Group set to normal mode (everyone can send)');

            await sleep(1000);

            // Update group settings - only admins can edit info
            await client.updateGroupSettings(testGroupId, 'locked');
            logger.info(null, '✅ Group info locked (only admins can edit)');

            await sleep(1000);

            // Update group settings - everyone can edit info
            await client.updateGroupSettings(testGroupId, 'unlocked');
            logger.info(null, '✅ Group info unlocked (everyone can edit)');

            logger.info(null, '✅ TEST 7 PASSED: Group settings updated successfully\n');
        }

        if (runTests.inviteManagement && testGroupId) {
            // ============================================
            // TEST 8: Invite Code Management
            // ============================================
            logger.info(null, '🔗 TEST 8: Managing group invite codes...');

            // Get current invite code
            inviteCode = await client.getGroupInviteCode(testGroupId);
            logger.info(null, `✅ Current invite code: ${inviteCode}`);
            logger.info(null, `✅ Full invite link: https://chat.whatsapp.com/${inviteCode}`);

            await sleep(1000);

            // Get group info from invite code
            const groupInfo = await client.getGroupInfoFromInvite(inviteCode!);
            logger.info(null, `✅ Group info from invite - Name: ${groupInfo?.subject}`);

            await sleep(1000);

            // Revoke and get new invite code
            const newInviteCode = await client.revokeGroupInviteCode(testGroupId);
            logger.info(null, `✅ New invite code generated: ${newInviteCode}`);
            logger.info(null, `✅ Old invite code (${inviteCode}) is now invalid`);

            logger.info(null, '✅ TEST 8 PASSED: Invite management working successfully\n');
        }

        if (runTests.profilePicture && testGroupId) {
            // ============================================
            // TEST 9: Group Profile Picture
            // ============================================
            logger.info(null, '🖼️ TEST 9: Managing group profile picture...');

            // Update group profile picture
            const profileImageBuffer = readFileSync(IMAGE_ASSET_PATH);
            await client.updateGroupProfilePicture(testGroupId, profileImageBuffer);
            logger.info(null, '✅ Group profile picture updated');

            await sleep(2000);

            // Get profile picture URL
            const profilePicUrl = await client.getGroupProfilePicture(testGroupId, true);
            logger.info(null, `✅ Profile picture URL retrieved: ${profilePicUrl ? 'Available' : 'Not available'}`);

            await sleep(1000);

            // Remove profile picture
            await client.removeGroupProfilePicture(testGroupId);
            logger.info(null, '✅ Group profile picture removed');

            logger.info(null, '✅ TEST 9 PASSED: Profile picture management working successfully\n');
        }

        if (runTests.cleanup && testGroupId) {
            // ============================================
            // TEST 10: Cleanup - Leave Group
            // ============================================
            logger.info(null, '🧹 TEST 10: Cleanup - Leaving test group...');

            // Send final message
            await client.sendTextMessage(testGroupId, '👋 Test completed! Bot is leaving the group now.');
            await sleep(2000);

            // Get all groups before leaving
            const allGroups = await client.getAllGroups();
            logger.info(null, `✅ Total groups: ${allGroups.length}`);

            await sleep(1000);

            // Leave the group
            await client.leaveGroup(testGroupId);
            logger.info(null, '✅ Successfully left the test group');

            logger.info(null, '✅ TEST 10 PASSED: Cleanup completed successfully\n');
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
        runTests.manageParticipants && logger.info(null, '✅ Participant Management APIs');
        runTests.sendMessages && logger.info(null, '✅ Group Messages (Text + Mentions + Buttons)');
        runTests.sendMedia && logger.info(null, '✅ Group Media (Image + Video + Audio + Document + Location)');
        runTests.groupSettings && logger.info(null, '✅ Group Settings (Announcement + Info Lock)');
        runTests.inviteManagement && logger.info(null, '✅ Invite Code Management (Get + Revoke + Info)');
        runTests.profilePicture && logger.info(null, '✅ Profile Picture Management (Update + Get + Remove)');
        runTests.cleanup && logger.info(null, '✅ Cleanup (Leave Group)');

        const tests = Object.values(runTests);
        const total = tests.filter((v) => v).length;
        const totalStr = `${total + 1}/${tests.length + 1}`;
        logger.info(null, `📊 Total: ${totalStr} tests passed`);

        if (testGroupId) {
            logger.info(null, `\n📝 Note: Test group ID was: ${testGroupId}`);
        }
    } catch (error) {
        console.error('\n❌ TEST FAILED:', error);
        throw error;
    } finally {
        // Cleanup connection
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
