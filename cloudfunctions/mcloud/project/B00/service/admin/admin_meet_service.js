/**
 * Notes: 预约后台管理
 * Ver : CCMiniCloud Framework 2.0.1 ALL RIGHTS RESERVED BY cclinux0730 (wechat)
 * Date: 2021-12-08 07:48:00 
 */

const BaseProjectAdminService = require('./base_project_admin_service.js');
const MeetService = require('../meet_service.js');
const dataUtil = require('../../../../framework/utils/data_util.js');
const timeUtil = require('../../../../framework/utils/time_util.js');
const setupUtil = require('../../../../framework/utils/setup/setup_util.js');
const util = require('../../../../framework/utils/util.js');
const cloudUtil = require('../../../../framework/cloud/cloud_util.js');
const cloudBase = require('../../../../framework/cloud/cloud_base.js');

const MeetModel = require('../../model/meet_model.js');
const JoinModel = require('../../model/join_model.js');
const DayModel = require('../../model/day_model.js');

const exportUtil = require('../../../../framework/utils/export_util.js');

const SETUP_MEET_TEMP_KEY = 'SETUP_MEET_TEMP';

// 导出报名数据KEY
const EXPORT_JOIN_DATA_KEY = 'EXPORT_JOIN_DATA';

class AdminMeetService extends BaseProjectAdminService {

	/** 预约数据列表 */
	async getDayList(meetId, start, end) {
		let where = {
			DAY_MEET_ID: meetId,
			day: ['between', start, end]
		}
		let orderBy = {
			day: 'asc'
		}
		return await DayModel.getAllBig(where, 'day,times,dayDesc', orderBy);
	}

	// 按项目统计人数
	async statJoinCntByMeet(meetId) {
		return await JoinModel.count({
			DAY_MEET_ID: meetId
		});
	}

	/** 自助签到码 */
	async genSelfCheckinQr(page, timeMark) {
		//生成小程序qr buffer
		let cloud = cloudBase.getCloud();

		if (page.startsWith('/projects/')) page = page.replace('/projects/', 'projects/');

		let result = await cloud.openapi.wxacode.getUnlimited({
			scene: timeMark,
			width: 280,
			check_path: false,
			env_version: 'release', //trial,develop
			page
		});

		let upload = await cloud.uploadFile({
			cloudPath: 'meet/usercheckin/' + timeMark + '.png',
			fileContent: result.buffer,
		});

		if (!upload || !upload.fileID) return;

		return upload.fileID;
	}

	/** 管理员按钮核销 */
	async checkinJoin(joinId, flag) {
		return await JoinModel.edit({
			DAY_JOIN_ID: joinId
		}, {
			DAY_JOIN_ADMIN: adminId,
			DAY_JOIN_ADMIN_NAME: adminName,
			DAY_JOIN_ADMIN_TIME: timeUtil.time(),
			DAY_JOIN_FLAG: flag
		});
	}

	/** 管理员扫码核销 */
	async scanJoin(meetId, code) {
		return await JoinModel.edit({
			DAY_MEET_ID: meetId,
			DAY_CODE: code
		}, {
			DAY_JOIN_ADMIN: adminId,
			DAY_JOIN_ADMIN_NAME: adminName,
			DAY_JOIN_ADMIN_TIME: timeUtil.time()
		});
	}

	/**
	 * 判断本日是否有预约记录
	 * @param {*} daySet daysSet的节点
	 */
	checkHasJoinCnt(times) {
		if (!times) return false;
		for (let k in times) {
			if (times[k].stat.succCnt) return true;
		}
		return false;
	}

	// 判断含有预约的日期
	getCanModifyDaysSet(daysSet) {
		let now = timeUtil.time('Y-M-D');

		for (let k in daysSet) {
			if (daysSet[k].day < now) continue;
			daysSet[k].hasJoin = this.checkHasJoinCnt(daysSet[k].times);
		}

		return daysSet;
	}

	/** 取消某个时间段的所有预约记录 */Ï
	async cancelJoinByTimeMark(admin, meetId, timeMark, reason) {
		return await JoinModel.edit({
			DAY_MEET_ID: meetId,
			DAY_TIME_MARK: timeMark,
			DAY_JOIN_FLAG: 0
		}, {
			DAY_JOIN_ADMIN: admin,
			DAY_JOIN_ADMIN_NAME: adminName,
			DAY_JOIN_ADMIN_TIME: timeUtil.time(),
			DAY_JOIN_REASON: reason
		});

	}


	/**添加 */
	async insertMeet(adminId, {
		title,
		order,
		typeId,
		typeName,
		daysSet,
		isShowLimit,
		formSet,
	}) {

		return await MeetModel.insert({
			MEET_TITLE: title,
			MEET_ORDER: order,
			MEET_TYPE_ID: typeId,
			MEET_TYPE_NAME: typeName,
			MEET_DAYS_SET: daysSet,
			MEET_IS_SHOW_LIMIT: isShowLimit,
			MEET_FORM_SET: formSet,
			MEET_ADMIN_ID: adminId,
		})
	}

	/**删除数据 */
	async delMeet(id) {
		return await MeetModel.del(id);
	}

	/**获取信息 */
	async getMeetDetail(id) {
		let fields = '*';

		let where = {
			_id: id
		}
		let meet = await MeetModel.getOne(where, fields);
		if (!meet) return null;

		let meetService = new MeetService();
		meet.MEET_DAYS_SET = await meetService.getDaysSet(id, timeUtil.time('Y-M-D')); //今天及以后

		return meet;
	}

	/**
	 * 更新富文本详细的内容及图片信息
	 * @returns 返回 urls数组 [url1, url2, url3, ...]
	 */
	async updateMeetContent({
		id,
		content // 富文本数组
	}) {

		return await MeetModel.edit({
			_id: id
		}, {
			MEET_CONTENT: content
		})

	}

	/**
	 * 更新封面内容及图片信息
	 * @returns 返回 urls数组 [url1, url2, url3, ...]
	 */
	async updateMeetStyleSet({
		meetId,
		styleSet
	}) {

		return await MeetModel.edit({
			_id: meetId
		}, {
			MEET_STYLE_SET: styleSet
		});

	}

	/** 更新日期设置 */
	async _editDays(meetId, nowDay, daysSetData) {
		return await DayModel.update({
			DAY_MEET_ID: meetId,
			DAY_DAY: nowDay
		}, {
			DAY_TIMES: daysSetData
		});
	}

	/**更新数据 */
	async editMeet({
		id,
		title,
		typeId,
		typeName,
		order,
		daysSet,
		isShowLimit,
		formSet
	}) {
		return await MeetModel.edit({
			_id: id
		}, {
			MEET_TITLE: title,
			MEET_TYPE_ID: typeId,
			MEET_TYPE_NAME: typeName,
			MEET_ORDER: order,
			MEET_DAYS_SET: daysSet,
			MEET_IS_SHOW_LIMIT: isShowLimit,
			MEET_FORM_SET: formSet
		});
	}

	/**预约名单分页列表 */
	async getJoinList({
		search, // 搜索条件
		sortType, // 搜索菜单
		sortVal, // 搜索菜单
		orderBy, // 排序
		meetId,
		mark,
		page,
		size,
		isTotal = true,
		oldTotal
	}) {

		orderBy = orderBy || {
			'JOIN_EDIT_TIME': 'desc'
		};
		let fields = 'JOIN_IS_CHECKIN,JOIN_CODE,JOIN_ID,JOIN_REASON,JOIN_USER_ID,JOIN_MEET_ID,JOIN_MEET_TITLE,JOIN_MEET_DAY,JOIN_MEET_TIME_START,JOIN_MEET_TIME_END,JOIN_MEET_TIME_MARK,JOIN_FORMS,JOIN_STATUS,JOIN_EDIT_TIME';

		let where = {
			JOIN_MEET_ID: meetId,
			JOIN_MEET_TIME_MARK: mark
		};
		if (util.isDefined(search) && search) {
			where['JOIN_FORMS.val'] = {
				$regex: '.*' + search,
				$options: 'i'
			};
		} else if (sortType && util.isDefined(sortVal)) {
			// 搜索菜单
			switch (sortType) {
				case 'status':
					// 按类型
					sortVal = Number(sortVal);
					if (sortVal == 1099) //取消的2种
						where.JOIN_STATUS = ['in', [10, 99]]
					else
						where.JOIN_STATUS = Number(sortVal);
					break;
				case 'checkin':
					// 签到
					where.JOIN_STATUS = JoinModel.STATUS.SUCC;
					if (sortVal == 1) {
						where.JOIN_IS_CHECKIN = 1;
					} else {
						where.JOIN_IS_CHECKIN = 0;
					}
					break;
			}
		}

		return await JoinModel.getList(where, fields, orderBy, page, size, isTotal, oldTotal);
	}

	/**预约项目分页列表 */
	async getMeetList({
		search, // 搜索条件
		sortType, // 搜索菜单
		sortVal, // 搜索菜单
		orderBy, // 排序
		whereEx, //附加查询条件
		page,
		size,
		isTotal = true,
		oldTotal
	}) {

		orderBy = orderBy || {
			'MEET_ORDER': 'asc',
			'MEET_ADD_TIME': 'desc'
		};
		let fields = 'MEET_TYPE,MEET_TYPE_NAME,MEET_TITLE,MEET_STATUS,MEET_DAYS,MEET_ADD_TIME,MEET_EDIT_TIME,MEET_ORDER';

		let where = {};
		if (util.isDefined(search) && search) {
			where.MEET_TITLE = {
				$regex: '.*' + search,
				$options: 'i'
			};
		} else if (sortType && util.isDefined(sortVal)) {
			// 搜索菜单
			switch (sortType) {
				case 'status':
					// 按类型
					where.MEET_STATUS = Number(sortVal);
					break;
				case 'typeId':
					// 按类型
					where.MEET_TYPE_ID = sortVal;
					break;
				case 'sort':
					// 排序
					if (sortVal == 'view') {
						orderBy = {
							'MEET_VIEW_CNT': 'desc',
							'MEET_ADD_TIME': 'desc'
						};
					}

					break;
			}
		}

		return await MeetModel.getList(where, fields, orderBy, page, size, isTotal, oldTotal);
	}

	/** 删除 */
	async delJoin(joinId) {
		return await JoinModel.del(joinId);

	}

	/**修改报名状态 
	 * 特殊约定 99=>正常取消 
	 */
	async statusJoin(admin, joinId, status, reason = '') {
		return await JoinModel.edit({
			_id: joinId
		}, {
			JOIN_ADMIN: admin,
			JOIN_ADMIN_NAME: adminName,
			JOIN_ADMIN_TIME: timeUtil.time(),
			JOIN_STATUS: status,
			JOIN_REASON: reason
		})
	}

	/**修改项目状态 */
	async statusMeet(id, status) {
		return await MeetModel.edit({
			_id: id
		}, {
			MEET_STATUS: status
		});
	}

	/**置顶排序设定 */
	async sortMeet(id, sort) {
		return await MeetModel.edit({
			_id: id
		}, {
			MEET_ORDER: sort
		});
	}

	//##################模板
	/**添加模板 */
	async insertMeetTemp({
		name,
		times,
	}) {
		return await setupUtil.add(SETUP_MEET_TEMP_KEY, {
			name,
			times
		});

	}

	/**更新数据 */
	async editMeetTemp({
		id,
		limit,
		isLimit
	}) {

		return await setupUtil.edit(SETUP_MEET_TEMP_KEY, {
			_id: id,
			limit,
			isLimit
		});
	}


	/**删除数据 */
	async delMeetTemp(id) {
		return await setupUtil.del(SETUP_MEET_TEMP_KEY, id);

	}


	/**模板列表 */
	async getMeetTempList() {
		let list = await setupUtil.get(SETUP_MEET_TEMP_KEY);
		if (!list || !Array.isArray(list)) list = [];
		return list;
	}

	// #####################导出报名数据
	/**获取报名数据 */
	async getJoinDataURL() {
		return await exportUtil.getExportDataURL(EXPORT_JOIN_DATA_KEY);
	}

	/**删除报名数据 */
	async deleteJoinDataExcel() {
		return await exportUtil.deleteDataExcel(EXPORT_JOIN_DATA_KEY);
	}

	/**导出报名数据 */
	async exportJoinDataExcel({
		meetId,
		startDay,
		endDay,
		status
	}) {
		return await exportUtil.exportDataExcel(EXPORT_JOIN_DATA_KEY, {
			meetId,
			startDay,
			endDay,
			status
		});

	}

}

module.exports = AdminMeetService;