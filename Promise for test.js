class Promise {
	#PromiseState = 'pending';
	#PromiseResult = void 0;
	#thenList = [];
	#resolvedBy = this;

	#asynchronousProcess = (process) => {
		setTimeout(process, 0);
	}
	#actThen() {
		for (let i = 0; i < this.#thenList.length; i++) {
			this.#thenList[i]();
		}
	}
	#checkResolved(process, parentResolvedBy) {
		return value => {
			if (parentResolvedBy !== this.#resolvedBy) {
				return;
			}
			this.#resolvedBy = value;
			return process(value);
		};
	}

	#resolve = value => {
		let typeofValue = typeof value;
		if (typeofValue === 'object' || typeofValue === 'function') {
			let then;
			try {
				then = value?.then;
			}
			catch (exception) {
				this.#reject(exception);
				return;
			}
			if (typeof then === 'function') {
				if (value === this) {
					this.#resolvedBy = new TypeError('Chaining cycle detected for promise #<Promise>');
					this.#reject(this.#resolvedBy);
					return;
				}
				const resolutionFunc = this.#checkResolved(this.#resolve, value);
				const rejectionFunc = this.#checkResolved(this.#reject, value);
				this.#asynchronousProcess(() => {
					try {
						then.call(value, resolutionFunc, rejectionFunc);
					}
					catch (exception) {
						rejectionFunc(exception);
					}
				});
				return;
			}
		}
		this.#PromiseResult = value;
		this.#PromiseState = 'fulfilled';
		this.#actThen();
	}
	#reject = (reason) => {
		this.#PromiseResult = reason;
		this.#PromiseState = 'rejected';
		this.#actThen();
	}

	constructor(executor) {
		if (typeof executor !== 'function') {
			if (typeof executor === 'object' && executor) {
				let className = executor.constructor?.name;
				let protoToString = Object.prototype.toString;
				if (executor.toString && executor.toString === protoToString && className) {
					executor = `#<${className}>`;
				}
				else {
					executor = protoToString.call(executor);
				}
			}
			else {
				if (executor) {
					executor = executor.toString();
				}
			}
			throw new TypeError(`Promise resolver ${executor} is not a function`);
		}
		const resolutionFunc = this.#checkResolved(this.#resolve, this);
		const rejectionFunc = this.#checkResolved(this.#reject, this);
		try {
			executor(resolutionFunc, rejectionFunc);
		}
		catch (exception) {
			rejectionFunc(exception);
		}
	}

	then(onFulfilled, onRejected) {
		if (typeof onFulfilled !== 'function') {
			onFulfilled = x => x;
		}
		if (typeof onRejected !== 'function') {
			onRejected = x => {
				throw x
			};
		}
		let result = new Promise((resolutionFunc, rejectionFunc) => {
			const setAction = () => {
				this.#asynchronousProcess(() => {
					try {
						if (this.#PromiseState === 'fulfilled') {
							resolutionFunc(onFulfilled(this.#PromiseResult));
						}
						else {
							resolutionFunc(onRejected(this.#PromiseResult));
						}
					}
					catch (exception) {
						rejectionFunc(exception);
					}
				})
			};
			if (this.#PromiseState !== 'pending') {
				setAction();
			}
			else {
				this.#thenList.push(setAction);
			}
		});
		return result;
	}
	catch(onRejected) {
		this.then(void 0, onRejected);
	}

	static resolve(value) {
		if (value instanceof Promise) {
			return value;
		}
		return new Promise(resolutionFunc => resolutionFunc(value));
	}
	static reject(reason) {
		return new Promise((resolutionFunc, rejectionFunc) => rejectionFunc(reason));
	}
	static all(iterable) {
		return new Promise((resolutionFunc, rejectionFunc) => {
			const list = Array.from(iterable, element => Promise.resolve(element));
			length = list.length;
			if (length === 0) {
				resolutionFunc(list);
			}
			let count = 0;
			list.forEach((element, index) => {
				element.then(value => {
					list[index] = value;
					count++;
					if (count === length) {
						resolutionFunc(list);
					}
				}, reason => rejectionFunc(reason));
			});
		});
	}
	static race(iterable) {
		return new Promise((resolutionFunc, rejectionFunc) => {
			const list = Array.from(iterable, element => Promise.resolve(element));
			list.forEach(element => element.then(value => resolutionFunc(value), reason => rejectionFunc(reason)));
		});
	}
}
/*本代码由SorryYearnt编写，转载请注明出处。This code was written by SorryYearnt. Please indicate the source when reprinting. このコードはSorryYearntによって書かれており、転載は出典を明記してください。*/

Promise.deferred = function () {
	let result = {};
	result.promise = new Promise((resolve, reject) => {
		result.resolve = resolve;
		result.reject = reject;
	});
	return result;
}

module.exports = Promise;
