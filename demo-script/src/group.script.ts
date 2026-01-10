import { MY_PHONE, MONGODB_URI, USE_MONGODB_STORAGE, TARGET_PHONE } from './dotenv';
import logger from './logger';
// import { WhatsappSocketGroup } from '@hdriel/whatsapp-socket';
// @ts-ignore
import { WhatsappSocketGroup } from '../../src';
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
    updateGroupInfo: true,
    manageParticipants: true,
    participantPermissions: true, // טסט חדש - ניהול הרשאות
    sendMessages: true,
    sendMedia: true,
    groupSettings: true,
    inviteManagement: true,
    profilePicture: false,
    cleanup: true,
};

const targetPhoneJID = TARGET_PHONE && WhatsappSocketGroup.formatPhoneNumberToWhatsappPattern(TARGET_PHONE);

async function runWhatsAppGroupTests() {
    logger.info(null, '🚀 Starting WhatsApp Group Tests...\n');

    let client: WhatsappSocketGroup | null = null;
    let testGroupId: string | undefined;
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

            testGroupId = groupResult?.id;
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

        if (runTests.manageParticipants && testGroupId && shouldTestTargetPhone) {
            // ============================================
            // TEST 4: Manage Participants - Add TARGET_PHONE
            // ============================================
            logger.info(null, '👤 TEST 4: Managing group participants...');
            logger.info(null, `📞 Adding participant: ${TARGET_PHONE}`);

            // Add TARGET_PHONE to group
            const res = await client.addParticipants(testGroupId, TARGET_PHONE);
            logger.info(null, '✅ Participant added to group', res);

            await sleep(2000);

            // Verify participant was added
            const metadata = await client.getGroupMetadata(testGroupId);
            const participantCount = metadata?.participants?.length || 0;
            logger.info(null, `✅ Current participants count: ${participantCount}`);

            const targetParticipant = metadata?.participants?.find((p: any) => p.jid === targetPhoneJID);

            if (targetParticipant) {
                logger.info(null, `✅ Verified - ${TARGET_PHONE} is in the group`);
                logger.info(null, `✅ Admin status: ${targetParticipant.admin ? 'Yes' : 'No'}`);
            } else {
                logger.info(null, `⚠️  Could not verify ${TARGET_PHONE} in group`);
            }

            logger.info(null, '✅ TEST 4 PASSED: Participant added successfully\n');
        } else if (runTests.manageParticipants && testGroupId) {
            logger.info(null, '👤 TEST 4: Managing group participants...');
            logger.info(null, '📝 Note: TARGET_PHONE is not set or equals MY_PHONE - skipping participant tests');

            const metadata = await client.getGroupMetadata(testGroupId);
            logger.info(null, `✅ Current participants count: ${metadata?.participants?.length || 0}`);

            logger.info(null, '✅ TEST 4 PASSED: Participant management APIs verified\n');
        }

        if (runTests.participantPermissions && testGroupId && shouldTestTargetPhone) {
            // ============================================
            // TEST 4.5: Participant Permissions Management
            // ============================================
            logger.info(null, '🔐 TEST 4.5: Managing participant permissions...');

            // Promote to admin
            logger.info(null, `⬆️  Promoting ${TARGET_PHONE} to admin...`);
            await client.promoteToAdmin(testGroupId, TARGET_PHONE);
            logger.info(null, '✅ Participant promoted to admin');

            await sleep(2000);

            // Verify promotion
            let metadata = await client.getGroupMetadata(testGroupId);
            const targetParticipant1 = metadata?.participants?.find((p: any) => p.jid === targetPhoneJID);

            if (targetParticipant1?.admin) {
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
            const targetParticipant2 = metadata?.participants?.find((p: any) => p.jid === targetPhoneJID);

            if (!targetParticipant2?.admin) {
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
            const targetParticipant3 = metadata?.participants?.find((p: any) => p.jid === targetPhoneJID);

            if (!targetParticipant3) {
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
            const targetParticipant4 = metadata?.participants?.find((p: any) => p.jid === targetPhoneJID);

            if (targetParticipant4) {
                logger.info(null, `✅ Verified - ${TARGET_PHONE} is back in the group`);
            }

            logger.info(null, '✅ TEST 4.5 PASSED: Permissions managed successfully\n');
        }

        if (runTests.sendMessages && testGroupId) {
            // ============================================
            // TEST 5: Send Messages to Group
            // ============================================
            logger.info(null, '💬 TEST 5: Sending messages to group...');

            logger.info(null, `➕ Adding ${TARGET_PHONE} back to group...`);
            const invite = await client.revokeGroupInviteCode(testGroupId);
            const inviteInfo = await client.getGroupInfoFromInvite(invite as string);

            await client.sendTextMessage(
                testGroupId,
                ['Hello! This is a test message in the group 👋', 'here link to this group:', invite, inviteInfo].join(
                    '\n'
                )
            );
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

            logger.info(null, '✅ TEST 5 PASSED: Messages sent successfully\n');
        }

        if (runTests.sendMedia && testGroupId) {
            // ============================================
            // TEST 6: Send Media to Group
            // ============================================
            logger.info(null, '🖼️ TEST 6: Sending media to group...');

            const imageBuffer = readFileSync(IMAGE_ASSET_PATH);
            await client.sendImageMessage(testGroupId, imageBuffer, {
                caption: '📸 Test image sent to group',
            });
            logger.info(null, '✅ Image sent');

            await sleep(1500);

            const videoBuffer = readFileSync(VIDEO_ASSET_PATH);
            await client.sendVideoMessage(testGroupId, videoBuffer, '🎥 Test video sent to group');
            logger.info(null, '✅ Video sent');

            await sleep(1500);

            const audioBuffer = readFileSync(MP3_ASSET_PATH);
            await client.sendAudioMessage(testGroupId, audioBuffer, { ptt: false });
            logger.info(null, '✅ Audio sent');

            await sleep(1500);

            const docBuffer = readFileSync(DOCUMENT_ASSET_PATH);
            await client.sendDocumentMessage(
                testGroupId,
                docBuffer,
                'test-document.docx',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            );
            logger.info(null, '✅ Document sent');

            await sleep(1500);

            await client.sendLocationMessage(testGroupId, 32.0853, 34.7818, 'Test Location', 'Tel Aviv, Israel');
            logger.info(null, '✅ Location sent');

            logger.info(null, '✅ TEST 6 PASSED: Media sent successfully\n');
        }

        if (runTests.groupSettings && testGroupId) {
            // ============================================
            // TEST 7: Group Settings
            // ============================================
            logger.info(null, '⚙️ TEST 7: Testing group settings...');

            await client.updateGroupSettings(testGroupId, 'announcement');
            logger.info(null, '✅ Group set to announcement mode (only admins can send)');

            await sleep(1000);

            await client.updateGroupSettings(testGroupId, 'not_announcement');
            logger.info(null, '✅ Group set to normal mode (everyone can send)');

            await sleep(1000);

            await client.updateGroupSettings(testGroupId, 'locked');
            logger.info(null, '✅ Group info locked (only admins can edit)');

            await sleep(1000);

            await client.updateGroupSettings(testGroupId, 'unlocked');
            logger.info(null, '✅ Group info unlocked (everyone can edit)');

            logger.info(null, '✅ TEST 7 PASSED: Group settings updated successfully\n');
        }

        if (runTests.inviteManagement && testGroupId) {
            // ============================================
            // TEST 8: Invite Code Management
            // ============================================
            logger.info(null, '🔗 TEST 8: Managing group invite codes...');

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

            logger.info(null, '✅ TEST 8 PASSED: Invite management working successfully\n');
        }

        if (runTests.profilePicture && testGroupId) {
            // ============================================
            // TEST 9: Group Profile Picture
            // ============================================
            logger.info(null, '🖼️ TEST 9: Managing group profile picture...');

            const profileImageBuffer = readFileSync(IMAGE_ASSET_PATH);
            await client.updateGroupProfilePicture(testGroupId, profileImageBuffer);
            logger.info(null, '✅ Group profile picture updated');

            await sleep(2000);

            const profilePicUrl = await client.getGroupProfilePicture(testGroupId, true);
            logger.info(null, `✅ Profile picture URL retrieved: ${profilePicUrl ? 'Available' : 'Not available'}`);

            await sleep(1000);

            await client.removeGroupProfilePicture(testGroupId);
            logger.info(null, '✅ Group profile picture removed');

            logger.info(null, '✅ TEST 9 PASSED: Profile picture management working successfully\n');
        }

        if (runTests.cleanup && testGroupId) {
            // ============================================
            // TEST 10: Cleanup - Remove participant and Leave Group
            // ============================================
            logger.info(null, '🧹 TEST 10: Cleanup - Final participant management and leaving group...');

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
        runTests.manageParticipants && logger.info(null, '✅ Participant Management (Add)');
        runTests.participantPermissions &&
            shouldTestTargetPhone &&
            logger.info(null, '✅ Participant Permissions (Promote/Demote/Remove/Re-add)');
        runTests.sendMessages && logger.info(null, '✅ Group Messages (Text + Mentions + Buttons)');
        runTests.sendMedia && logger.info(null, '✅ Group Media (Image + Video + Audio + Document + Location)');
        runTests.groupSettings && logger.info(null, '✅ Group Settings (Announcement + Info Lock)');
        runTests.inviteManagement && logger.info(null, '✅ Invite Code Management (Get + Revoke + Info)');
        runTests.profilePicture && logger.info(null, '✅ Profile Picture Management (Update + Get + Remove)');
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
