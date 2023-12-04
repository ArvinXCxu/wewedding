/**
 * Notes: 资讯后台管理
 * Ver : CCMiniCloud Framework 2.0.1 ALL RIGHTS RESERVED BY cclinux0730 (wechat)
 * Date: 2021-07-11 07:48:00
 */

const BaseProjectAdminService = require('./base_project_admin_service.js');

const dataUtil = require('../../../../framework/utils/data_util.js');
const util = require('../../../../framework/utils/util.js');
const cloudUtil = require('../../../../framework/cloud/cloud_util.js');

const setupUtil = require("../../../../framework/utils/setup/setup_util");

class AdminNewsService extends BaseProjectAdminService {

	/**添加资讯 */
	async insertNews({
		title,
		cateId, //分类
		cateName,
		order,
		desc = '',
	}) {

		let data = {};
		data.NEWS_TITLE = title;
		data.NEWS_DESC = desc;
	 	data.NEWS_CATE_ID = cateId;
	    data.NEWS_CATE_NAME = cateName;
		data.NEWS_ORDER =order ;
		data.NEWS_PIC = [];
		data.NEWS_CONTENT = [];
		return await NewsModel.insert(data);
	}

	/**删除资讯数据 */
	async delNews(id) {
		console.log('id',id)
		let where = {
			_id: id
		}
		return await NewsModel.del(where)

	}

	/**获取资讯信息 */
	async getNewsDetail(id) {
		let fields = '*';

		let where = {
			_id: id
		}
		let news = await NewsModel.getOne(where, fields);
		if (!news) return null;

		return news;
	}

	/**
	 * 更新富文本详细的内容及图片信息
	 * @returns 返回 urls数组 [url1, url2, url3, ...]
	 */
	async updateNewsContent({
		id,
		content // 富文本数组
	}) {
		let where = {
			_id: id
		}
		let data = {};
		data.NEWS_CONTENT=content
		return await NewsModel.insertOrUpdate(where,data,false)
	}

	/**
	 * 更新资讯图片信息
	 * @returns 返回 urls数组 [url1, url2, url3, ...]
	 */
	async updateNewsPic({
		id,
		imgList // 图片数组
	}) {
		let where = {
			_id: id
		}
		let data = {};
		data.NEWS_PIC=imgList
		return await NewsModel.insertOrUpdate(where,data,false)
	}


	/**更新资讯数据 */
	async editNews({
		id,
		title,
		cateId, //分类
		cateName,
		order,
		desc = '',
	}) {
		let where = {
			_id: id
		}
		let data = {};
		data.NEWS_TITLE = title;
		data.NEWS_DESC = desc;
		data.NEWS_CATE_ID = cateId;
		data.NEWS_CATE_NAME = cateName;
		data.NEWS_ORDER =order ;
		return await NewsModel.insertOrUpdate(where,data,false)
	}

	/**取得资讯分页列表 */
	async getNewsList({
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
			'NEWS_ORDER': 'asc',
			'NEWS_ADD_TIME': 'desc'
		};
		let fields = 'NEWS_TITLE,NEWS_DESC,NEWS_CATE_ID,NEWS_CATE_NAME,NEWS_EDIT_TIME,NEWS_ADD_TIME,NEWS_ORDER,NEWS_STATUS,NEWS_CATE2_NAME,NEWS_HOME';

		let where = {};

		if (util.isDefined(search) && search) {
			where.NEWS_TITLE = ['like', search];

		} else if (sortType && util.isDefined(sortVal)) {
			// 搜索菜单
			switch (sortType) {
				case 'cateId':
					where.NEWS_CATE_ID = sortVal;
					break;
				case 'status':
					where.NEWS_STATUS = Number(sortVal);
					break;
				case 'home':
					where.NEWS_HOME = Number(sortVal);
					break;
				case 'sort':
					if (sortVal == 'new') {
						orderBy = {
							'NEWS_ADD_TIME': 'desc'
						};
					}
					break;
			}
		}

		return await NewsModel.getList(where, fields, orderBy, page, size, isTotal, oldTotal);
	}

	/**修改资讯状态 */
	async statusNews(id, status) {
		let where = {
			_id: id
		}
		let data = {};
		data.NEWS_STATUS=status
		return await NewsModel.insertOrUpdate(where,data,false)
	}

	/**置顶与排序设定 */
	async sortNews(id, sort) {
		let where = {
			_id: id
		}
		let data = {};
		data.NEWS_ORDER=sort
		return await NewsModel.insertOrUpdate(where,data,false)
	}
Ï
	/**首页设定 */
	async homeNews(id, home) {
		let where = {
			_id: id
		}
		let data = {};
		data.NEWS_ORDER=home
		return await NewsModel.insertOrUpdate(where,data,false)
	}
}

module.exports = AdminNewsService;