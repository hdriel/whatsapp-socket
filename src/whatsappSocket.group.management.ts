import type { GroupMetadata, ParticipantAction } from '@fadzzzslebew/baileys';
import { WhatsappSocketBase, type WhatsappSocketBaseProps } from './whatsappSocket.base';
import type { CreateGroupOptions, GroupSettingsType } from './decs';
export type { WhatsappSocketBaseProps as WhatsappSocketGroupsProps } from './whatsappSocket.base';

export class WhatsappSocketGroups extends WhatsappSocketBase {
    /**
     * פורמט Group ID לתבנית WhatsApp
     * Format Group ID to WhatsApp pattern
     * Group IDs end with @g.us instead of @s.whatsapp.net
     */
    static formatGroupId(groupId: string): string {
        if (groupId.endsWith('@g.us')) return groupId;
        const cleanId = groupId.replace(/@s\.whatsapp\.net|@g\.us/g, '');

        return `${cleanId}@g.us`;
    }

    /**
     * בדיקה האם מדובר ב-Group ID או Phone Number
     * Check if this is a group ID or phone number
     */
    static isGroupId(jid: string): boolean {
        return jid.endsWith('@g.us');
    }

    constructor(props: WhatsappSocketBaseProps) {
        super(props);
    }

    /**
     * Create a new WhatsApp group
     */
    async createGroup({ name, participants, description }: CreateGroupOptions): Promise<any> {
        if (!name) {
            throw new Error('createGroup: Group name is required.');
        }
        await this.ensureSocketConnected();

        // Format phone numbers to WhatsApp pattern
        const formattedParticipants: string[] = (participants ?? []).map((phone) =>
            WhatsappSocketGroups.formatPhoneNumberToWhatsappPattern(phone)
        );

        // If no participants provided, use self (bot's own number)
        if (formattedParticipants.length === 0) {
            const selfJid = this.socket?.user?.id; // Get bot's own JID (user ID)
            if (!selfJid) {
                throw new Error('createGroup: Could not get bot user ID. Make sure socket is connected.');
            }

            const pId = WhatsappSocketGroups.formatPhoneNumberToWhatsappPattern(selfJid);
            formattedParticipants.push(pId);

            if (this.debug) {
                this.logger?.debug('WHATSAPP', 'No participants provided, creating group with self only', {
                    selfJid,
                });
            }
        }

        if (this.debug) {
            this.logger?.debug('WHATSAPP', 'Creating group', {
                name,
                description,
                participants: formattedParticipants,
            });
        }

        const result = await this.socket?.groupCreate(name, formattedParticipants);

        // Set description if provided
        if (description && result?.id) {
            const formattedGroupId = WhatsappSocketGroups.formatGroupId(result.id);
            await this.updateGroupDescription(formattedGroupId, description);
        }

        return result;
    }

    /**
     * Update group name (subject)
     */
    async updateGroupName(groupId: string, newName: string): Promise<any> {
        if (!groupId || !newName) {
            throw new Error('updateGroupName: Group ID and new name are required.');
        }

        await this.ensureSocketConnected();

        const formattedGroupId = WhatsappSocketGroups.formatGroupId(groupId);

        if (this.debug) {
            this.logger?.debug('WHATSAPP', 'Updating group name', { groupId: formattedGroupId, newName });
        }

        return this.socket?.groupUpdateSubject(formattedGroupId, newName);
    }

    /**
     * Update group description
     */
    async updateGroupDescription(groupId: string, description: string): Promise<any> {
        if (!groupId) {
            throw new Error('updateGroupDescription: Group ID is required.');
        }

        await this.ensureSocketConnected();

        const formattedGroupId = WhatsappSocketGroups.formatGroupId(groupId);

        if (this.debug) {
            this.logger?.debug('WHATSAPP', 'Updating group description', { groupId: formattedGroupId });
        }

        return this.socket?.groupUpdateDescription(formattedGroupId, description || '');
    }

    /**
     * Update group settings (who can send messages, edit info, etc.)
     */
    async updateGroupSettings(groupId: string, setting: GroupSettingsType): Promise<any> {
        if (!groupId || !setting) {
            throw new Error('updateGroupSettings: Group ID and setting are required.');
        }

        await this.ensureSocketConnected();

        const formattedGroupId = WhatsappSocketGroups.formatGroupId(groupId);

        if (this.debug) {
            this.logger?.debug('WHATSAPP', 'Updating group settings', { groupId: formattedGroupId, setting });
        }

        return this.socket?.groupSettingUpdate(formattedGroupId, setting);
    }

    private async updateGroupParticipants(
        groupId: string,
        participant: string | string[],
        action: ParticipantAction
    ): Promise<any> {
        if (!groupId) throw new Error('addParticipants: Group ID is required.');
        const participants = ([] as string[]).concat(participant).filter((v) => v);
        if (!participants?.length) return;
        await this.ensureSocketConnected();

        const formattedGroupId = WhatsappSocketGroups.formatGroupId(groupId);
        const formattedParticipants = participants.map((phone) =>
            WhatsappSocketGroups.formatPhoneNumberToWhatsappPattern(phone)
        );

        if (this.debug) {
            this.logger?.debug('WHATSAPP', `${action} participants to group`, {
                groupId: formattedGroupId,
                participantsCount: formattedParticipants.length,
            });
        }

        return this.socket?.groupParticipantsUpdate(formattedGroupId, formattedParticipants, action);
    }

    /**
     * Add participants to group
     */
    async addParticipants(groupId: string, participant: string | string[]): Promise<any> {
        return this.updateGroupParticipants(groupId, participant, 'add');
    }

    /**
     * Remove participants from group
     */
    async removeParticipants(groupId: string, participant: string | string[]): Promise<any> {
        return this.updateGroupParticipants(groupId, participant, 'remove');
    }

    /**
     * Promote participant to admin
     */
    async promoteToAdmin(groupId: string, participant: string | string[]): Promise<any> {
        return this.updateGroupParticipants(groupId, participant, 'promote');
    }

    /**
     * הורדת משתתף ממנהל
     * Demote participant from admin
     */
    async demoteFromAdmin(groupId: string, participant: string | string[]): Promise<any> {
        return this.updateGroupParticipants(groupId, participant, 'demote');
    }

    /**
     * Leave a group
     */
    async leaveGroup(groupId: string): Promise<any> {
        if (!groupId) throw new Error('leaveGroup: Group ID is required.');
        await this.ensureSocketConnected();

        const formattedGroupId = WhatsappSocketGroups.formatGroupId(groupId);

        if (this.debug) {
            this.logger?.debug('WHATSAPP', 'Leaving group', { groupId: formattedGroupId });
        }

        return this.socket?.groupLeave(formattedGroupId);
    }

    /**
     * Get group metadata
     */
    async getGroupMetadata(groupId: string): Promise<GroupMetadata | undefined> {
        if (!groupId) throw new Error('getGroupMetadata: Group ID is required.');
        await this.ensureSocketConnected();

        const formattedGroupId = WhatsappSocketGroups.formatGroupId(groupId);

        if (this.debug) {
            this.logger?.debug('WHATSAPP', 'Fetching group metadata', { groupId: formattedGroupId });
        }

        return this.socket?.groupMetadata(formattedGroupId);
    }

    /**
     * Get all groups
     */
    async getAllGroups(): Promise<GroupMetadata[]> {
        await this.ensureSocketConnected();

        if (this.debug) {
            this.logger?.debug('WHATSAPP', 'Fetching all groups');
        }

        const groups = await this.socket?.groupFetchAllParticipating();
        return groups ? Object.values(groups) : [];
    }

    /**
     * Get group invite code
     */
    async getGroupInviteCode(groupId: string): Promise<string | undefined> {
        if (!groupId) throw new Error('getGroupInviteCode: Group ID is required.');
        await this.ensureSocketConnected();

        const formattedGroupId = WhatsappSocketGroups.formatGroupId(groupId);

        if (this.debug) {
            this.logger?.debug('WHATSAPP', 'Fetching group invite code', { groupId: formattedGroupId });
        }

        return this.socket?.groupInviteCode(formattedGroupId);
    }

    /**
     * Revoke group invite code (creates new one)
     */
    async revokeGroupInviteCode(groupId: string): Promise<string | undefined> {
        if (!groupId) throw new Error('revokeGroupInviteCode: Group ID is required.');
        await this.ensureSocketConnected();

        const formattedGroupId = WhatsappSocketGroups.formatGroupId(groupId);

        if (this.debug) {
            this.logger?.debug('WHATSAPP', 'Revoking group invite code', { groupId: formattedGroupId });
        }

        return this.socket?.groupRevokeInvite(formattedGroupId);
    }

    /**
     * Join group using invite code
     */
    async joinGroupViaInvite(inviteCode: string): Promise<string | undefined> {
        if (!inviteCode) throw new Error('joinGroupViaInvite: Invite code is required.');
        await this.ensureSocketConnected();

        if (this.debug) {
            this.logger?.debug('WHATSAPP', 'Joining group via invite', { inviteCode });
        }

        return this.socket?.groupAcceptInvite(inviteCode);
    }

    /**
     * Get group info from invite code
     */
    async getGroupInfoFromInvite(inviteCode: string): Promise<any> {
        if (!inviteCode) throw new Error('getGroupInfoFromInvite: Invite code is required.');
        await this.ensureSocketConnected();

        if (this.debug) {
            this.logger?.debug('WHATSAPP', 'Fetching group info from invite', { inviteCode });
        }

        return this.socket?.groupGetInviteInfo(inviteCode);
    }

    /**
     * Update group profile picture
     */
    async updateGroupProfilePicture(groupId: string, imageBuffer: Buffer): Promise<any> {
        if (!groupId || !imageBuffer) {
            throw new Error('updateGroupProfilePicture: Group ID and image buffer are required.');
        }
        await this.ensureSocketConnected();

        const formattedGroupId = WhatsappSocketGroups.formatGroupId(groupId);

        if (this.debug) {
            this.logger?.debug('WHATSAPP', 'Updating group profile picture', { groupId: formattedGroupId });
        }

        return this.socket?.updateProfilePicture(formattedGroupId, imageBuffer);
    }

    /**
     * Remove group profile picture
     */
    async removeGroupProfilePicture(groupId: string): Promise<any> {
        if (!groupId) throw new Error('removeGroupProfilePicture: Group ID is required.');
        await this.ensureSocketConnected();

        const formattedGroupId = WhatsappSocketGroups.formatGroupId(groupId);

        if (this.debug) {
            this.logger?.debug('WHATSAPP', 'Removing group profile picture', { groupId: formattedGroupId });
        }

        return this.socket?.removeProfilePicture(formattedGroupId);
    }

    /**
     * Get group profile picture URL
     */
    async getGroupProfilePicture(groupId: string, highRes: boolean = false): Promise<string | undefined> {
        if (!groupId) throw new Error('getGroupProfilePicture: Group ID is required.');
        await this.ensureSocketConnected();

        const formattedGroupId = WhatsappSocketGroups.formatGroupId(groupId);

        if (this.debug) {
            this.logger?.debug('WHATSAPP', 'Fetching group profile picture', { groupId: formattedGroupId, highRes });
        }

        return this.socket?.profilePictureUrl(formattedGroupId, highRes ? 'image' : 'preview');
    }
}
