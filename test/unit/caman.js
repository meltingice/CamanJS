import Caman from '../../src/CamanJS';

describe('Caman', () => {
  describe('Greet function', () => {
    beforeEach(() => {
      spy(Caman, 'greet');
      Caman.greet();
    });

    it('should have been run once', () => {
      expect(Caman.greet).to.have.been.calledOnce;
    });

    it('should have always returned hello', () => {
      expect(Caman.greet).to.have.always.returned('hello');
    });
  });
});
