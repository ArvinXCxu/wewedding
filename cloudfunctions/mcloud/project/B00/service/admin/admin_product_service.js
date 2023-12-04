/**
 * Notes: 套系后台管理
 * Ver : CCMiniCloud Framework 2.0.1 ALL RIGHTS RESERVED BY cclinux0730 (wechat)
 * Date: 2022-06-08 07:48:00 
 */

const BaseProjectAdminService = require('./base_project_admin_service.js');

const dataUtil = require('../../../../framework/utils/data_util.js');
const util = require('../../../../framework/utils/util.js');
const cloudUtil = require('../../../../framework/cloud/cloud_util.js');

const ProductModel = require('../../model/product_model.js');

class AdminProductService extends BaseProjectAdminService {

	/**添加 */
	async insertProduct({
		title,
		cateId,
		cateName,
		order,
		forms
	}) {
		return await ProductModel.insert({
			title,
			cateId,
			cateName,
			order,
			forms
		});
	}

	/**删除数据 */
	async delProduct(id) {
		return await ProductModel.del(id);
	}

	/**获取信息 */
	async getProductDetail(id) {
		let fields = '*';

		let where = {
			_id: id
		}
		let product = await ProductModel.getOne(where, fields);
		if (!product) return null;

		return product;
	}

	// 更新forms信息
	async updateProductForms({
		id,
		hasImageForms
	}) {
		return await ProductModel.update({
			_id: id
		}, {
			$set: {
				'PRODUCT_OBJ.hasImageForms': hasImageForms
			}
		});
	}

	/**更新数据 */
	async editProduct({
		id,
		title,
		cateId, // 二级分类 
		cateName,
		order,
		forms,
	}) {
		return await ProductModel.update({
			_id: id
		}, {
			$set: {
				'PRODUCT_TITLE': title,
				'PRODUCT_CATE_ID': cateId,
				'PRODUCT_CATE_NAME': cateName,
				'PRODUCT_ORDER': order,
				'PRODUCT_OBJ.forms': forms
			}
		});
	}

	/**取得分页列表 */
	async getProductList({
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
			'PRODUCT_ORDER': 'asc',
			'PRODUCT_ADD_TIME': 'desc'
		};
		let fields = 'PRODUCT_TITLE,PRODUCT_CATE_ID,PRODUCT_CATE_NAME,PRODUCT_EDIT_TIME,PRODUCT_ADD_TIME,PRODUCT_ORDER,PRODUCT_STATUS,PRODUCT_HOME,PRODUCT_OBJ.price,PRODUCT_OBJ.origPrice';

		let where = {};
		where.and = {
			_pid: this.getProjectId() //复杂的查询在此处标注PID
		};

		if (util.isDefined(search) && search) {
			where.or = [
				{ PRODUCT_TITLE: ['like', search] },
			];

		} else if (sortType && util.isDefined(sortVal)) {
			// 搜索菜单
			switch (sortType) {
				case 'cateId': {
					where.and.PRODUCT_CATE_ID = String(sortVal);
					break;
				}
				case 'status': {
					where.and.PRODUCT_STATUS = Number(sortVal);
					break
				}
				case 'sort': {
					// 排序
					if (sortVal == 'price_desc') {
						orderBy = {
							'PRODUCT_OBJ.price': 'desc',
							'PRODUCT_ADD_TIME': 'desc'
						};
					}
					if (sortVal == 'price_asc') {
						orderBy = {
							'PRODUCT_OBJ.price': 'asc',
							'PRODUCT_ADD_TIME': 'desc'
						};
					}
					if (sortVal == 'home') {
						where.and.PRODUCT_HOME = 1;
					}
					if (sortVal == 'top') {
						where.and.PRODUCT_ORDER = 0;
					}
					if (sortVal == 'new') {
						orderBy = {
							'PRODUCT_ADD_TIME': 'desc'
						};
					}
					break;
				}
			}
		}

		return await ProductModel.getList(where, fields, orderBy, page, size, isTotal, oldTotal);
	}

	/**修改状态 */
	async statusProduct(id, status) {
		return await ProductModel.update({
			_id: id
		}, {
			$set: {
				'PRODUCT_STATUS': status
			}
		});
	}

	/**置顶与排序设定 */
	async sortProduct(id, sort) {
		return await ProductModel.update({
			_id: id
		}, {
			$set: {
				'PRODUCT_ORDER': sort
			}
		});
	}

	/**首页设定 */
	async homeProduct(id, home) {
		return await ProductModel.update({
			_id: id
		}, {
			$set: {
				'PRODUCT_HOME': home
			}
		});
	}
}

module.exports = AdminProductService;